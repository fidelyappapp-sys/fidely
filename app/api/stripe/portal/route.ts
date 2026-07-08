import { NextResponse } from "next/server";
import { requireMerchantContext } from "@/lib/merchant";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { appBaseUrl, isStripeConfigured } from "@/lib/env";

export const runtime = "nodejs";

export async function POST() {
  if (!isStripeConfigured) {
    return NextResponse.json({ error: "La facturation n'est pas encore configurée." }, { status: 503 });
  }

  const merchant = await requireMerchantContext();
  const db = createServiceRoleClient();

  const { data } = await db
    .from("merchants")
    .select("stripe_customer_id")
    .eq("id", merchant.merchantId)
    .single();

  if (!data?.stripe_customer_id) {
    return NextResponse.json({ error: "Aucun abonnement Stripe pour ce commerce." }, { status: 400 });
  }

  const session = await stripe().billingPortal.sessions.create({
    customer: data.stripe_customer_id,
    return_url: `${appBaseUrl()}/dashboard/billing`,
  });

  return NextResponse.json({ url: session.url });
}
