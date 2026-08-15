import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { appBaseUrl, isStripeConfigured } from "@/lib/env";
import { publicNfcCheckoutSchema } from "@/lib/validation/schemas";
import { tieredNfcUnitPriceCents, TIERED_NFC_SHIPPING_CENTS, findTieredNfcProduct } from "@/lib/boutique";

export const runtime = "nodejs";

// Anonymous purchase from the public /avis-google page — no merchant
// account required, so this can't go through requireMerchantContext or the
// merchant-scoped shop_orders table (see supabase/migrations/
// 0025_public_shop_orders.sql). Always shipped: there's no "hand delivery"
// option without an existing merchant relationship — that free-install path
// stays the separate "Commander mon pack" → /signup CTA on the same page.
// Buyer email/name/address aren't collected here; Stripe Checkout's own
// shipping_address_collection + email prompt gather them, and the webhook
// (app/api/stripe/webhook) fills the order row in from the completed session.
export async function POST(request: Request) {
  if (!isStripeConfigured) {
    return NextResponse.json({ error: "La facturation n'est pas encore configurée." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const parsed = publicNfcCheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Requête invalide." }, { status: 400 });
  }

  const product = findTieredNfcProduct("nfc_card")!;
  const { quantity } = parsed.data;
  const unitAmountCents = tieredNfcUnitPriceCents(quantity);
  const amountCents = unitAmountCents * quantity + TIERED_NFC_SHIPPING_CENTS;

  const db = createServiceRoleClient();
  const { data: order, error: orderError } = await db
    .from("public_shop_orders")
    .insert({
      item_key: "nfc_card",
      quantity,
      unit_amount_cents: unitAmountCents,
      amount_cents: amountCents,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: orderError?.message ?? "Impossible de créer la commande." }, { status: 500 });
  }

  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    shipping_address_collection: { allowed_countries: ["FR"] },
    line_items: [
      {
        price_data: { currency: "eur", unit_amount: unitAmountCents, product_data: { name: product.label } },
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
