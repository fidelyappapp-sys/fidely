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

  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: process.env.STRIPE_METERED_PRICE_ID! }],
    success_url: `${appBaseUrl()}/dashboard/billing?checkout=success`,
    cancel_url: `${appBaseUrl()}/dashboard/billing?checkout=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
