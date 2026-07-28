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

  // Every line item on the metered price only invoices at the end of its
  // first billing cycle (30 days) — a Checkout Session in "subscription"
  // mode would save the card without ever actually verifying it's valid
  // and chargeable until that first invoice, a month later. Using "setup"
  // mode instead runs a real (non-charging) SetupIntent verification up
  // front; the webhook then creates the actual subscription once that
  // verification succeeds (see activateSubscriptionFromSetup).
  const session = await stripe().checkout.sessions.create({
    mode: "setup",
    customer: customerId,
    payment_method_types: ["card"],
    metadata: { type: "merchant_subscription_setup", merchant_id: merchant.merchantId },
    success_url: `${appBaseUrl()}/dashboard/billing?checkout=success`,
    cancel_url: `${appBaseUrl()}/dashboard/billing?checkout=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
