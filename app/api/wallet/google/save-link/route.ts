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
      "id, public_id, points, google_object_id, merchants(slug, business_name, brand_color, logo_url), loyalty_programs(reward_threshold, reward_description)"
    )
    .eq("public_id", publicId)
    .maybeSingle();

  if (!card) {
    return NextResponse.json({ error: "Carte introuvable." }, { status: 404 });
  }

  const merchant = card.merchants as unknown as {
    slug: string;
    business_name: string;
    brand_color: string;
    logo_url: string | null;
  } | null;
  const program = card.loyalty_programs as unknown as {
    reward_threshold: number;
    reward_description: string;
  } | null;

  if (!merchant || !program) {
    return NextResponse.json({ error: "Programme introuvable." }, { status: 404 });
  }

  if (!merchant.logo_url) {
    return NextResponse.json(
      { error: "Google Wallet nécessite un logo pour ce commerce (Paramètres → Logo)." },
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
        merchantSlug: merchant.slug,
        businessName: merchant.business_name,
        brandColorHex: merchant.brand_color,
        rewardDescription: program.reward_description,
        logoUrl: merchant.logo_url,
      });

      objectId = await upsertLoyaltyObject({
        classId,
        publicId: card.public_id,
        points: card.points,
        rewardThreshold: program.reward_threshold,
        rewardDescription: program.reward_description,
        qrValue: signedQrPayload(card.public_id),
      });

      await db.from("loyalty_cards").update({ google_object_id: objectId }).eq("id", card.id);
    }

    const saveUrl = await buildGoogleWalletSaveUrl(objectId, loyaltyClassId(merchant.slug));
    return NextResponse.redirect(saveUrl);
  } catch (err) {
    console.error("Google wallet save-link failed", err);
    return NextResponse.json(
      { error: "Google Wallet est temporairement indisponible. Réessayez dans quelques minutes." },
      { status: 502 }
    );
  }
}
