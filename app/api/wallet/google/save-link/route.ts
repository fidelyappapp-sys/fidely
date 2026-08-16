import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { signedQrPayload } from "@/lib/qr/generate";
import { isGoogleWalletConfigured } from "@/lib/env";
import { upsertLoyaltyClass, upsertLoyaltyObject, loyaltyClassId } from "@/lib/wallet/google/objects";
import { buildGoogleWalletSaveUrl } from "@/lib/wallet/google/saveLink";
import {
  resolveCardDesign,
  POINT_OF_SALE_DESIGN_FIELDS,
  MERCHANT_DESIGN_FIELDS,
  type PointOfSaleDesignRow,
  type MerchantDesignRow,
} from "@/lib/wallet/design";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isGoogleWalletConfigured) {
    return NextResponse.json({ error: "Google Wallet non configuré." }, { status: 503 });
  }

  const publicId = new URL(request.url).searchParams.get("publicId");
  if (!publicId) {
    return NextResponse.json({ error: "publicId manquant." }, { status: 400 });
  }

  const db = createServiceRoleClient();
  const { data: card } = await db
    .from("loyalty_cards")
    .select(
      `id, public_id, points, google_object_id, merchant_qr_code_id, merchants(${MERCHANT_DESIGN_FIELDS}), loyalty_programs(name, display_mode, reward_threshold, reward_description), merchant_qr_codes(city, ${POINT_OF_SALE_DESIGN_FIELDS})`
    )
    .eq("public_id", publicId)
    .maybeSingle();

  if (!card) {
    return NextResponse.json({ error: "Carte introuvable." }, { status: 404 });
  }

  const merchant = card.merchants as unknown as MerchantDesignRow | null;
  const program = card.loyalty_programs as unknown as {
    name: string;
    display_mode: "stamps" | "points";
    reward_threshold: number;
    reward_description: string;
  } | null;
  const pointOfSale = card.merchant_qr_codes as unknown as
    | (PointOfSaleDesignRow & { city: string | null })
    | null;

  if (!merchant || !program || !card.merchant_qr_code_id) {
    return NextResponse.json({ error: "Programme introuvable." }, { status: 404 });
  }

  // Falls back to the merchant's own design when this point of sale hasn't
  // customized its own (see supabase/migrations/0024_pos_card_design.sql).
  const design = resolveCardDesign(pointOfSale, merchant);

  if (!design.logoUrl) {
    return NextResponse.json(
      { error: "Google Wallet nécessite un logo pour ce point de vente (Paramètres → Logo)." },
      { status: 503 }
    );
  }

  let objectId = card.google_object_id;

  // The Google Wallet API calls below (token exchange + Wallet Objects
  // REST calls) previously ran unguarded: any failure — an expired
  // credential, a GCP-side outage, or the API being unreachable — crashed
  // this route with an uncaught exception, which Next.js turns into a
  // bare, empty-body 500 (the browser's generic "this page isn't working"
  // error). Catching it here means a Google Wallet outage degrades to a
  // clear, actionable error instead of taking the whole route down.
  try {
    if (!objectId) {
      const classId = await upsertLoyaltyClass({
        pointOfSaleId: card.merchant_qr_code_id,
        businessName: merchant.business_name,
        programName: program.name,
        brandColorHex: design.brandColor,
        logoUrl: design.logoUrl,
        backgroundPhotoUrl: design.backgroundPhotoEnabled ? design.backgroundPhotoUrl : null,
      });

      objectId = await upsertLoyaltyObject({
        classId,
        publicId: card.public_id,
        points: card.points,
        displayMode: program.display_mode,
        rewardThreshold: program.reward_threshold,
        rewardDescription: program.reward_description,
        qrValue: signedQrPayload(card.public_id),
        city: pointOfSale?.city,
      });

      await db.from("loyalty_cards").update({ google_object_id: objectId }).eq("id", card.id);
    }

    const saveUrl = await buildGoogleWalletSaveUrl(objectId, loyaltyClassId(card.merchant_qr_code_id));
    return NextResponse.redirect(saveUrl);
  } catch (err) {
    console.error("Google wallet save-link failed", err);
    return NextResponse.json(
      { error: "Google Wallet est temporairement indisponible. Réessayez dans quelques minutes." },
      { status: 502 }
    );
  }
}
