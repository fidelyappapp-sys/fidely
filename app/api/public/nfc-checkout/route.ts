import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { appBaseUrl, isStripeConfigured } from "@/lib/env";
import { publicNfcCheckoutSchema } from "@/lib/validation/schemas";
import { TIERED_NFC_PRODUCT, TIERED_NFC_SHIPPING_CENTS, plaqueUnitPriceCents } from "@/lib/boutique";
import { getAnonymousOwnedPlaqueCount } from "@/lib/boutique.server";

export const runtime = "nodejs";

// Anonymous purchase from the public /avis-google page — Avis tier only
// (Présence/Pro require an account, see that page's CTAs), no merchant
// account required, so this can't go through requireMerchantContext or the
// merchant-scoped shop_orders table (see supabase/migrations/
// 0025_public_shop_orders.sql). Always shipped: there's no "hand delivery"
// option without an existing merchant relationship — that free-install path
// stays the separate "Commander mon pack" → /signup CTA on the same page.
// buyerEmail/googleReviewLink are collected here (unlike before) because the
// lifetime-cumulative discount must be priced correctly before Checkout is
// created, and the review link + a rotating edit token need somewhere to
// live even with no merchant account (see avis_links, app/avis/edit).
export async function POST(request: Request) {
  if (!isStripeConfigured) {
    return NextResponse.json({ error: "La facturation n'est pas encore configurée." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const parsed = publicNfcCheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Requête invalide." }, { status: 400 });
  }

  const { quantity, buyerEmail, googleReviewLink } = parsed.data;
  const alreadyOwned = await getAnonymousOwnedPlaqueCount(buyerEmail);
  const unitAmountCents = plaqueUnitPriceCents("avis", alreadyOwned, quantity);
  const amountCents = unitAmountCents * quantity + TIERED_NFC_SHIPPING_CENTS;

  const db = createServiceRoleClient();
  const { data: order, error: orderError } = await db
    .from("public_shop_orders")
    .insert({
      item_key: "nfc_card",
      quantity,
      unit_amount_cents: unitAmountCents,
      amount_cents: amountCents,
      buyer_email: buyerEmail,
      tier: "avis",
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: orderError?.message ?? "Impossible de créer la commande." }, { status: 500 });
  }

  const { error: avisLinkError } = await db.from("avis_links").insert({
    public_shop_order_id: order.id,
    buyer_email: buyerEmail,
    google_review_link: googleReviewLink,
  });
  if (avisLinkError) {
    return NextResponse.json({ error: "Impossible d'enregistrer votre lien d'avis." }, { status: 500 });
  }

  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    customer_email: buyerEmail,
    shipping_address_collection: { allowed_countries: ["FR"] },
    line_items: [
      {
        price_data: { currency: "eur", unit_amount: unitAmountCents, product_data: { name: TIERED_NFC_PRODUCT.label } },
        quantity,
      },
      {
        price_data: {
          currency: "eur",
          unit_amount: TIERED_NFC_SHIPPING_CENTS,
          product_data: { name: "Livraison" },
        },
        quantity: 1,
      },
    ],
    metadata: { type: "public_boutique_order", order_id: order.id },
    success_url: `${appBaseUrl()}/avis-google?checkout=success`,
    cancel_url: `${appBaseUrl()}/avis-google?checkout=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
