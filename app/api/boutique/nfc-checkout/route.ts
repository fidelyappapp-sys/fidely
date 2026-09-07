import { NextResponse } from "next/server";
import { requireMerchantContext } from "@/lib/merchant";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { appBaseUrl, isStripeConfigured } from "@/lib/env";
import { nfcCardCheckoutSchema } from "@/lib/validation/schemas";
import { PLAQUE_TIER_LABELS, TIERED_NFC_SHIPPING_CENTS, TIERED_NFC_PRODUCT, plaqueUnitPriceCents } from "@/lib/boutique";
import { getMerchantOwnedPlaqueCount } from "@/lib/boutique.server";
import { getOrCreateStripeCustomerId } from "@/lib/stripe/customer";
import type { KitShippingAddress, ShopOrderItem } from "@/lib/supabase/types";

export const runtime = "nodejs";

// Separate from /api/boutique/checkout: the plaque is priced by lifetime
// cumulative volume bracket (see plaqueUnitPriceCents in lib/boutique.ts)
// rather than a fixed per-unit Stripe Price, so its Checkout line item is
// built from inline price_data instead of a pre-created STRIPE_PRICE_* env
// var — same dynamic-amount approach chooseKitDelivery already uses for the
// 3,99€ postal fee (lib/actions/kitDelivery.ts).
export async function POST(request: Request) {
  if (!isStripeConfigured) {
    return NextResponse.json({ error: "La facturation n'est pas encore configurée." }, { status: 503 });
  }

  const merchant = await requireMerchantContext();
  if (merchant.role !== "owner") {
    return NextResponse.json({ error: "Réservé au propriétaire du commerce." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = nfcCardCheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Requête invalide." }, { status: 400 });
  }

  const { quantity, deliveryMethod, tier } = parsed.data;
  const db = createServiceRoleClient();

  const { data: existingSubscription } = await db
    .from("merchant_plaque_subscriptions")
    .select("status")
    .eq("merchant_id", merchant.merchantId)
    .maybeSingle();
  const hasActivePlaqueSubscription = existingSubscription?.status === "active";

  if (tier === "pro" && !hasActivePlaqueSubscription && !parsed.data.billingInterval) {
    return NextResponse.json({ error: "Choisissez un mode de facturation pour l'abonnement Pro." }, { status: 400 });
  }

  const alreadyOwned = await getMerchantOwnedPlaqueCount(merchant.merchantId);
  const unitAmountCents = plaqueUnitPriceCents(tier, alreadyOwned, quantity);
  const shippingCents = deliveryMethod === "postal_shipping" ? TIERED_NFC_SHIPPING_CENTS : 0;
  const amountCents = unitAmountCents * quantity + shippingCents;

  const orderItems: ShopOrderItem[] = [
    {
      key: TIERED_NFC_PRODUCT.key,
      label: `${TIERED_NFC_PRODUCT.label} — ${PLAQUE_TIER_LABELS[tier]}`,
      quantity,
      unitAmountCents,
    },
  ];

  const shippingAddress: KitShippingAddress | null =
    deliveryMethod === "postal_shipping"
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
      delivery_method: deliveryMethod,
      shipping_address: shippingAddress,
      tier,
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

  const lineItems: Array<{
    price?: string;
    price_data?: { currency: string; unit_amount: number; product_data: { name: string } };
    quantity: number;
  }> = [
    {
      price_data: { currency: "eur", unit_amount: unitAmountCents, product_data: { name: TIERED_NFC_PRODUCT.label } },
      quantity,
    },
  ];
  if (shippingCents > 0) {
    lineItems.push({
      price_data: { currency: "eur", unit_amount: shippingCents, product_data: { name: "Livraison" } },
      quantity: 1,
    });
  }

  const wantsNewSubscription = tier === "pro" && !hasActivePlaqueSubscription;
  if (wantsNewSubscription) {
    const billingInterval = parsed.data.billingInterval!;
    const priceId =
      billingInterval === "month"
        ? process.env.STRIPE_PRICE_PLAQUE_PRO_MONTHLY
        : process.env.STRIPE_PRICE_PLAQUE_PRO_ANNUAL;
    if (!priceId) {
      return NextResponse.json({ error: "Abonnement Pro non configuré côté serveur." }, { status: 503 });
    }
    lineItems.push({ price: priceId, quantity: 1 });
  }

  const session = await stripe().checkout.sessions.create({
    mode: wantsNewSubscription ? "subscription" : "payment",
    customer: customerId,
    line_items: lineItems,
    metadata: wantsNewSubscription
      ? {
          type: "plaque_pro_checkout",
          order_id: order.id,
          merchant_id: merchant.merchantId,
          billing_interval: parsed.data.billingInterval!,
        }
      : { type: "boutique_order", order_id: order.id, merchant_id: merchant.merchantId },
    subscription_data: wantsNewSubscription
      ? { metadata: { subscription_kind: "plaque_pro", merchant_id: merchant.merchantId } }
      : undefined,
    success_url: `${appBaseUrl()}/boutique?checkout=success`,
    cancel_url: `${appBaseUrl()}/boutique?checkout=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
