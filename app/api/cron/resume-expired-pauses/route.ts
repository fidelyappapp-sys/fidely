import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";

export const runtime = "nodejs";

// Auto-resumes any subscription paused for the full 3-month cap. Same
// pause_collection mechanism as the manual "Reprendre mon abonnement"
// action in lib/actions/billing.ts, just triggered by the schedule instead
// of the merchant. Scheduled via vercel.json; guarded by CRON_SECRET.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const db = createServiceRoleClient();
  const { data: expired } = await db
    .from("merchants")
    .select("id, stripe_subscription_id")
    .eq("subscription_status", "paused")
    .lte("subscription_pause_ends_at", new Date().toISOString());

  let resumed = 0;
  for (const merchant of expired ?? []) {
    if (!merchant.stripe_subscription_id) continue;
    try {
      const subscription = await stripe().subscriptions.update(merchant.stripe_subscription_id, {
        pause_collection: null,
      });
      await db
        .from("merchants")
        .update({
          subscription_status: subscription.status,
          subscription_paused_at: null,
          subscription_pause_ends_at: null,
          pause_reminder_sent_at: null,
        })
        .eq("id", merchant.id);
      resumed++;
    } catch (err) {
      console.error("Auto-resume failed", merchant.id, err);
    }
  }

  return NextResponse.json({ resumed });
}
