import { createServiceRoleClient } from "@/lib/supabase/server";
import { stripe } from "./client";

// Returns the merchant's Stripe customer id, creating one lazily if it
// doesn't exist yet (e.g. Stripe wasn't configured at onboarding time).
export async function getOrCreateStripeCustomerId(params: {
  merchantId: string;
  businessName: string;
  email: string | null;
}): Promise<string> {
  const db = createServiceRoleClient();

  const { data: merchant } = await db
    .from("merchants")
    .select("stripe_customer_id")
    .eq("id", params.merchantId)
    .single();

  if (merchant?.stripe_customer_id) return merchant.stripe_customer_id;

  const customer = await stripe().customers.create({
    email: params.email ?? undefined,
    name: params.businessName,
    metadata: { merchant_id: params.merchantId },
  });

  await db
    .from("merchants")
    .update({ stripe_customer_id: customer.id })
    .eq("id", params.merchantId);

  return customer.id;
}
