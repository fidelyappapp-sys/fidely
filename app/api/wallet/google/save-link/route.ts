import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { signedQrPayload } from "@/lib/qr/generate";
import { isGoogleWalletConfigured } from "@/lib/env";
import { upsertLoyaltyClass, upsertLoyaltyObject, loyaltyClassId } from "@/lib/wallet/google/objects";
import { buildGoogleWalletSaveUrl } from "@/lib/wallet/google/saveLink";

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
      "id, public_id, points, google_object_id, merchant_qr_code_id, merchants(business_name, brand_color, logo_url, background_photo_url, background_photo_enabled), loyalty_programs(display_mode, reward_threshold, reward_description), merchant_qr_codes(city, brand_color, logo_url, background_photo_url, background_photo_enabled)"
    )
    .eq("public_id", publicId)
    .maybeSingle();

  if (!card) {
    return NextResponse.json({ error: "Carte introuvable." }, { status: 404 });
  }

  const merchant = card.merchants as unknown as {
    business_name: string;
    brand_color: string;
    logo_url: string | null;
    background_photo_url: string | null;
    background_photo_enabled: boolean;
  } | null;
  const program = card.loyalty_programs as unknown as {
    display_mode: "stamps" | "points";
    reward_threshold: number;
    reward_description: string;
  } | null;
  const pointOfSale = card.merchant_qr_codes as unknown as {
    city: string | null;
    brand_color: string | null;
    logo_url: string | null;
    background_photo_url: string | null;
    background_photo_enabled: boolean | null;
  } | null;

  if (!merchant || !program || !card.merchant_qr_code_id) {
    return NextResponse.json({ error: "Programme introuvable." }, { status: 404 });
  }

  // Falls back to the merchant's own design when this point of sale hasn't
  // customized its own (see supabase/migrations/0024_pos_card_design.sql).
  const brandColorHex = pointOfSale?.brand_color ?? merchant.brand_color;
  const logoUrl = pointOfSale?.logo_url ?? merchant.logo_url;
  const backgroundPhotoEnabled = pointOfSale?.background_photo_enabled ?? merchant.background_photo_enabled;
  const backgroundPhotoUrl = pointOfSale?.background_photo_url ?? merchant.background_photo_url;

  if (!logoUrl) {
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
        brandColorHex,
        logoUrl,
        backgroundPhotoUrl: backgroundPhotoEnabled ? backgroundPhotoUrl : null,
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
