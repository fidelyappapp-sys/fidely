import { NextResponse } from "next/server";
import { requireMerchantContext } from "@/lib/merchant";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getOrCreateStripeCustomerId } from "@/lib/stripe/customer";
import { stripe } from "@/lib/stripe/client";
import { appBaseUrl, isStripeConfigured } from "@/lib/env";

export const runtime = "nodejs";

export async function POST() {
  if (!isStripeConfigured) {
    return NextResponse.json({ error: "La facturation n'est pas encore configurée." }, { status: 503 });
  }

  const merchant = await requireMerchantContext();
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const customerId = await getOrCreateStripeCustomerId({
    merchantId: merchant.merchantId,
    businessName: merchant.businessName,
    email: user?.email ?? null,
  });

  // Every line item on this price is usage_type: "metered" (see
  // scripts/stripe-setup.ts) — Stripe never invoices a metered-only
  // subscription at creation time, only at the end of its first billing
  // cycle (30 days, per that price's interval). So "card saved now, first
  // charge 30 days later" falls out of this on its own; no
  // trial_period_days/billing_cycle_anchor needed. That stops being true
  // the day a non-metered (flat) line item is added to this Checkout
  // Session — that combination *does* invoice immediately.
  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: process.env.STRIPE_METERED_PRICE_ID! }],
    success_url: `${appBaseUrl()}/dashboard/billing?checkout=success`,
    cancel_url: `${appBaseUrl()}/dashboard/billing?checkout=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
