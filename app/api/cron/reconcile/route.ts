import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isStripeConfigured } from "@/lib/env";
import { reportScanUsage } from "@/lib/stripe/usage";
import { notifyAppleWalletUpdate } from "@/lib/wallet/apple/notify";
import { notifyGoogleWalletUpdate } from "@/lib/wallet/google/notify";
import type { Database } from "@/lib/supabase/types";

export const runtime = "nodejs";

type ScanEventUpdate = Database["public"]["Tables"]["scan_events"]["Update"];

// Retries scan-time side effects (Stripe usage reporting, wallet pushes)
// that failed on the first attempt. Scheduled via vercel.json cron; guarded
// by CRON_SECRET so it can't be triggered by the public internet.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const db = createServiceRoleClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: failedScans } = await db
    .from("scan_events")
    .select(
      "id, stripe_usage_reported, apple_push_status, google_push_status, loyalty_cards(pass_serial_number, google_object_id, points, merchants(stripe_customer_id))"
    )
    .gte("created_at", since)
    .or("stripe_usage_reported.eq.false,apple_push_status.eq.failed,google_push_status.eq.failed")
    .limit(200);

  let retried = 0;

  for (const scan of failedScans ?? []) {
    const card = scan.loyalty_cards as unknown as {
      pass_serial_number: string;
      google_object_id: string | null;
      points: number;
      merchants: { stripe_customer_id: string | null } | null;
    } | null;
    if (!card) continue;

    const updates: ScanEventUpdate = {};

    if (!scan.stripe_usage_reported && isStripeConfigured && card.merchants?.stripe_customer_id) {
      try {
        const result = await reportScanUsage({
          stripeCustomerId: card.merchants.stripe_customer_id,
          identifier: scan.id,
        });
        updates.stripe_usage_reported = true;
        updates.stripe_meter_event_id = result.id;
      } catch (err) {
        console.error("Reconcile: stripe usage retry failed", scan.id, err);
      }
    }

    if (scan.apple_push_status === "failed") {
      updates.apple_push_status = await notifyAppleWalletUpdate(card.pass_serial_number);
    }

    if (scan.google_push_status === "failed") {
      updates.google_push_status = await notifyGoogleWalletUpdate(card.google_object_id, card.points);
    }

    if (Object.keys(updates).length > 0) {
      await db.from("scan_events").update(updates).eq("id", scan.id);
      retried++;
    }
  }

  await db.rpc("prune_rate_limit_events");

  return NextResponse.json({ scanned: failedScans?.length ?? 0, retried });
}
