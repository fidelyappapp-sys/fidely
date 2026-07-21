import { NextResponse } from "next/server";
import { requireMerchantContext } from "@/lib/merchant";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { appBaseUrl, isStripeConfigured } from "@/lib/env";
import { boutiqueCheckoutSchema } from "@/lib/validation/schemas";
import { findBoutiqueProduct } from "@/lib/boutique";
import { getOrCreateStripeCustomerId } from "@/lib/stripe/customer";
import type { KitShippingAddress, ShopOrderItem } from "@/lib/supabase/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isStripeConfigured) {
    return NextResponse.json({ error: "La facturation n'est pas encore configurée." }, { status: 503 });
  }

  const merchant = await requireMerchantContext();
  if (merchant.role !== "owner") {
    return NextResponse.json({ error: "Réservé au propriétaire du commerce." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = boutiqueCheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Requête invalide." }, { status: 400 });
  }

  const lineItems: { price: string; quantity: number }[] = [];
  const orderItems: ShopOrderItem[] = [];
  let amountCents = 0;

  for (const item of parsed.data.items) {
    const product = findBoutiqueProduct(item.key);
    const priceId = product && process.env[product.priceEnvVar];
    if (!product || !priceId) {
      return NextResponse.json({ error: "Produit indisponible." }, { status: 400 });
    }
    lineItems.push({ price: priceId, quantity: item.quantity });
    orderItems.push({
      key: product.key,
      label: product.label,
      quantity: item.quantity,
      unitAmountCents: product.amountCents,
    });
    amountCents += product.amountCents * item.quantity;
  }

  const shippingAddress: KitShippingAddress | null =
    parsed.data.deliveryMethod === "postal_shipping"
      ? {
          name: parsed.data.shippingName,
          line1: parsed.data.shippingLine1,
          line2: parsed.data.shippingLine2 || "",
          postalCode: parsed.data.shippingPostalCode,
          city: parsed.data.shippingCity,
          country: parsed.data.shippingCountry,
        }
      : null;

  const supabase = await createServerSupabaseClient();
  const { data: order, error: orderError } = await supabase
    .from("shop_orders")
    .insert({
      merchant_id: merchant.merchantId,
      items: orderItems,
      amount_cents: amountCents,
      delivery_method: parsed.data.deliveryMethod,
      shipping_address: shippingAddress,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: orderError?.message ?? "Impossible de créer la commande." }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const customerId = await getOrCreateStripeCustomerId({
    merchantId: merchant.merchantId,
    businessName: merchant.businessName,
    email: user?.email ?? null,
  });

  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items: lineItems,
    metadata: { type: "boutique_order", order_id: order.id, merchant_id: merchant.merchantId },
    success_url: `${appBaseUrl()}/boutique?checkout=success`,
    cancel_url: `${appBaseUrl()}/boutique?checkout=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
