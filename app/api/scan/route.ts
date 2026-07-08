import { NextResponse } from "next/server";
import { getStaffContextOrNull } from "@/lib/merchant";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyQrPayload } from "@/lib/qr/verify";
import { scanSchema } from "@/lib/validation/schemas";
import { isStripeConfigured } from "@/lib/env";
import { reportScanUsage } from "@/lib/stripe/usage";
import { notifyAppleWalletUpdate } from "@/lib/wallet/apple/notify";
import { notifyGoogleWalletUpdate } from "@/lib/wallet/google/notify";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const staff = await getStaffContextOrNull();
  if (!staff) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { allowed } = await checkRateLimit({
    bucketKey: `scan:${staff.merchantId}`,
    limit: 120,
    windowSeconds: 60,
  });
  if (!allowed) {
    return NextResponse.json({ error: "Trop de scans, ralentissez un instant." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = scanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const verified = verifyQrPayload(parsed.data.payload);
  if (!verified) {
    return NextResponse.json({ error: "QR code invalide ou falsifié." }, { status: 400 });
  }

  const db = createServiceRoleClient();

  const { data: card } = await db
    .from("loyalty_cards")
    .select("id, merchant_id, customers(full_name)")
    .eq("public_id", verified.publicId)
    .maybeSingle();

  if (!card) {
    return NextResponse.json({ error: "Carte de fidélité introuvable." }, { status: 404 });
  }

  if (card.merchant_id !== staff.merchantId) {
    return NextResponse.json(
      { error: "Cette carte n'appartient pas à votre commerce." },
      { status: 403 }
    );
  }

  const { data: result, error: rpcError } = await db
    .rpc("award_scan_points", {
      p_loyalty_card_id: card.id,
      p_staff_user_id: staff.userId,
    })
    .single();

  if (rpcError || !result) {
    return NextResponse.json(
      { error: rpcError?.message ?? "Impossible d'attribuer les points." },
      { status: 500 }
    );
  }

  const [stripeOutcome, applePushStatus, googlePushStatus] = await Promise.allSettled([
    isStripeConfigured && result.stripe_customer_id
      ? reportScanUsage({
          stripeCustomerId: result.stripe_customer_id,
          identifier: result.scan_event_id,
        })
      : Promise.resolve(null),
    notifyAppleWalletUpdate(result.pass_serial_number),
    notifyGoogleWalletUpdate(result.google_object_id, result.points_balance_after),
  ]);

  await db
    .from("scan_events")
    .update({
      stripe_usage_reported: stripeOutcome.status === "fulfilled" && stripeOutcome.value !== null,
      stripe_meter_event_id:
        stripeOutcome.status === "fulfilled" ? (stripeOutcome.value?.id ?? null) : null,
      apple_push_status: applePushStatus.status === "fulfilled" ? applePushStatus.value : "failed",
      google_push_status:
        googlePushStatus.status === "fulfilled" ? googlePushStatus.value : "failed",
    })
    .eq("id", result.scan_event_id);

  const customer = card.customers as unknown as { full_name: string | null } | null;

  return NextResponse.json({
    customerName: customer?.full_name ?? null,
    pointsAwarded: result.points_awarded,
    pointsBalance: result.points_balance_after,
  });
}
