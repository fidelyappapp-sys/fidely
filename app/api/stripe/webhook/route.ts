import { randomBytes, createHash } from "crypto";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendOrderConfirmationEmail, sendAdminOrderNotification, sendEmail } from "@/lib/email";
import { recordInvoiceFromStripeEvent } from "@/lib/invoicing";
import { appBaseUrl } from "@/lib/env";
import type { KitShippingAddress, PlaqueTier, ShopOrderItem } from "@/lib/supabase/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook non configuré." }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    return NextResponse.json({ error: "Signature invalide." }, { status: 400 });
  }

  const db = createServiceRoleClient();

  // Idempotency: Stripe may redeliver events; skip ones we've already processed.
  const { data: existing } = await db
    .from("stripe_webhook_events")
    .select("id")
    .eq("id", event.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  await db.from("stripe_webhook_events").insert({
    id: event.id,
    type: event.type,
    payload: event as unknown as Record<string, unknown>,
  });

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.type === "boutique_order") {
        await processBoutiqueOrder(db, session);
      } else if (session.metadata?.type === "public_boutique_order") {
        await processPublicBoutiqueOrder(db, session);
      } else if (session.metadata?.type === "plaque_pro_checkout") {
        await processPlaqueProCheckout(db, session);
      } else if (session.metadata?.type === "merchant_subscription_setup") {
        await activateSubscriptionFromSetup(db, session);
      } else if (session.customer && session.subscription) {
        await syncSubscription(
          db,
          session.customer as string,
          session.subscription as string
        );
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      const subscription = event.data.object as Stripe.Subscription;
      if (subscription.metadata?.subscription_kind === "plaque_pro") {
        await syncPlaqueSubscription(db, subscription);
      } else {
        await db
          .from("merchants")
          .update({
            stripe_subscription_id: subscription.id,
            stripe_subscription_item_id: subscription.items.data[0]?.id ?? null,
            subscription_status: resolveSubscriptionStatus(subscription),
          })
          .eq("stripe_customer_id", subscription.customer as string);
      }
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      if (subscription.metadata?.subscription_kind === "plaque_pro") {
        await db
          .from("merchant_plaque_subscriptions")
          .update({ status: "canceled", canceled_at: new Date().toISOString() })
          .eq("stripe_subscription_id", subscription.id);
      } else {
        await db
          .from("merchants")
          .update({ subscription_status: "canceled", subscription_canceled_at: new Date().toISOString() })
          .eq("stripe_customer_id", subscription.customer as string);
      }
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoiceSubscriptionId(invoice);
      if (subscriptionId && (await isPlaqueProSubscription(db, subscriptionId))) {
        await db.from("merchant_plaque_subscriptions").update({ status: "past_due" }).eq("stripe_subscription_id", subscriptionId);
      } else if (invoice.customer) {
        await db
          .from("merchants")
          .update({ subscription_status: "past_due" })
          .eq("stripe_customer_id", invoice.customer as string);
      }
      await recordInvoiceFromStripeEvent(db, invoice);
      break;
    }
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoiceSubscriptionId(invoice);
      if (subscriptionId && (await isPlaqueProSubscription(db, subscriptionId))) {
        const subscription = await stripe().subscriptions.retrieve(subscriptionId);
        await syncPlaqueSubscription(db, subscription);
      } else if (invoice.customer) {
        await db
          .from("merchants")
          .update({ subscription_status: "active" })
          .eq("stripe_customer_id", invoice.customer as string);
      }
      await recordInvoiceFromStripeEvent(db, invoice);
      break;
    }
    case "invoice.created":
    case "invoice.finalized": {
      // Mirrors the invoice locally as soon as Stripe issues it (usually
      // still "open", not yet paid) so it shows up in the admin invoices
      // list right away rather than only once payment succeeds/fails.
      await recordInvoiceFromStripeEvent(db, event.data.object as Stripe.Invoice);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}

async function syncSubscription(
  db: ReturnType<typeof createServiceRoleClient>,
  customerId: string,
  subscriptionId: string
) {
  const subscription = await stripe().subscriptions.retrieve(subscriptionId);
  await db
    .from("merchants")
    .update({
      stripe_subscription_id: subscription.id,
      stripe_subscription_item_id: subscription.items.data[0]?.id ?? null,
      subscription_status: resolveSubscriptionStatus(subscription),
    })
    .eq("stripe_customer_id", customerId);
}

// Completes the €0 card-verification flow (spec 2.2): the Checkout Session
// that got us here ran in "setup" mode, so no subscription exists yet — a
// successful SetupIntent already confirmed the card is valid and chargeable
// (real bank authorization, no funds captured) before we get here. Attach
// that verified payment method to the customer and only now create the
// actual metered subscription.
async function activateSubscriptionFromSetup(
  db: ReturnType<typeof createServiceRoleClient>,
  session: Stripe.Checkout.Session
) {
  const merchantId = session.metadata?.merchant_id;
  const customerId = session.customer as string | null;
  const setupIntentId = session.setup_intent as string | null;
  if (!merchantId || !customerId || !setupIntentId) return;

  const setupIntent = await stripe().setupIntents.retrieve(setupIntentId);
  const paymentMethodId = setupIntent.payment_method as string | null;
  if (!paymentMethodId) return;

  await stripe().customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });

  const subscription = await stripe().subscriptions.create({
    customer: customerId,
    items: [{ price: process.env.STRIPE_METERED_PRICE_ID! }],
    default_payment_method: paymentMethodId,
  });

  await db
    .from("merchants")
    .update({
      stripe_subscription_id: subscription.id,
      stripe_subscription_item_id: subscription.items.data[0]?.id ?? null,
      subscription_status: resolveSubscriptionStatus(subscription),
    })
    .eq("id", merchantId);
}

async function processBoutiqueOrder(
  db: ReturnType<typeof createServiceRoleClient>,
  session: Stripe.Checkout.Session
) {
  const orderId = session.metadata?.order_id;
  if (!orderId) return;

  const { data: order } = await db
    .from("shop_orders")
    .update({ status: "paid", stripe_checkout_session_id: session.id })
    .eq("id", orderId)
    .select("id, merchant_id, items, amount_cents, delivery_method, shipping_address, tier")
    .single();

  if (!order) return;

  if (order.tier) {
    await mintPlaques({ db, tier: order.tier, merchantId: order.merchant_id, shopOrderId: order.id, quantity: itemsQuantity(order.items as ShopOrderItem[]) });
  }

  const { data: merchant } = await db
    .from("merchants")
    .select("business_name, auth_user_id")
    .eq("id", order.merchant_id)
    .single();

  if (!merchant) return;

  const { data: userResult } = await db.auth.admin.getUserById(merchant.auth_user_id);
  const merchantEmail = userResult.user?.email;

  const items = order.items as ShopOrderItem[];

  await Promise.allSettled([
    merchantEmail
      ? sendOrderConfirmationEmail({
          to: merchantEmail,
          businessName: merchant.business_name,
          items,
          amountCents: order.amount_cents,
          deliveryMethod: order.delivery_method ?? "hand_delivery",
        })
      : Promise.resolve(),
    sendAdminOrderNotification({
      businessName: merchant.business_name,
      items,
      amountCents: order.amount_cents,
      deliveryMethod: order.delivery_method ?? "hand_delivery",
      shippingAddress: order.shipping_address as KitShippingAddress | null,
    }),
  ]);
}

// Anonymous purchase from /avis-google (see app/api/public/nfc-checkout) —
// no merchant, so buyer_email/name/shipping_address are unknown until now:
// filled in here from the completed session's own customer_details /
// collected_information.shipping_details (shipping_address_collection was
// enabled at session creation).
async function processPublicBoutiqueOrder(
  db: ReturnType<typeof createServiceRoleClient>,
  session: Stripe.Checkout.Session
) {
  const orderId = session.metadata?.order_id;
  if (!orderId) return;

  const shipping = session.collected_information?.shipping_details;
  const buyerEmail = session.customer_details?.email ?? null;
  const buyerName = shipping?.name ?? session.customer_details?.name ?? null;
  const address = shipping?.address ?? session.customer_details?.address ?? null;

  const { data: order } = await db
    .from("public_shop_orders")
    .update({
      status: "paid",
      stripe_checkout_session_id: session.id,
      buyer_email: buyerEmail,
      buyer_name: buyerName,
      shipping_address: address
        ? {
            name: buyerName ?? "",
            line1: address.line1 ?? "",
            line2: address.line2 ?? "",
            postalCode: address.postal_code ?? "",
            city: address.city ?? "",
            country: address.country ?? "",
          }
        : null,
    })
    .eq("id", orderId)
    .select("id, item_key, quantity, unit_amount_cents, amount_cents, shipping_address")
    .single();

  if (!order) return;

  const { data: avisLink } = await db
    .from("avis_links")
    .select("id, buyer_email, google_review_link")
    .eq("public_shop_order_id", order.id)
    .maybeSingle();

  if (avisLink) {
    await mintPlaques({ db, tier: "avis", avisLinkId: avisLink.id, publicShopOrderId: order.id, quantity: order.quantity });

    const rawToken = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    await db
      .from("avis_links")
      .update({ edit_token_hash: tokenHash, edit_token_rotated_at: new Date().toISOString() })
      .eq("id", avisLink.id);

    await sendEmail(
      avisLink.buyer_email,
      "Votre lien de modification Fidély",
      `<p>Bonjour,</p><p>Voici votre lien pour modifier le lien d'avis Google de votre plaque à tout moment :</p><p><a href="${appBaseUrl()}/avis/edit/${rawToken}">${appBaseUrl()}/avis/edit/${rawToken}</a></p><p>Conservez cet email : ce lien est à usage personnel et change à chaque modification pour votre sécurité.</p>`
    );
  }

  const items = [{ label: "Plaque avis Google", quantity: order.quantity }];

  await Promise.allSettled([
    buyerEmail
      ? sendOrderConfirmationEmail({
          to: buyerEmail,
          businessName: buyerName ?? buyerEmail,
          items,
          amountCents: order.amount_cents,
          deliveryMethod: "postal_shipping",
        })
      : Promise.resolve(),
    sendAdminOrderNotification({
      businessName: buyerName ?? buyerEmail ?? "Acheteur anonyme",
      items,
      amountCents: order.amount_cents,
      deliveryMethod: "postal_shipping",
      shippingAddress: order.shipping_address as KitShippingAddress | null,
    }),
  ]);
}

// Stripe's own subscription.status stays "active" while pause_collection is
// set (pausing billing doesn't change the subscription's lifecycle status),
// so a naive sync would silently un-pause a merchant the moment any
// customer.subscription.updated event arrives. Treat pause_collection as
// the source of truth for our "paused" app-level status instead.
function resolveSubscriptionStatus(subscription: Stripe.Subscription): string {
  return subscription.pause_collection ? "paused" : subscription.status;
}

function itemsQuantity(items: ShopOrderItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

// Creates one `plaques` row per physical unit paid for — this is the
// identity later encoded onto that unit's QR/NFC (see app/admin/(protected)/
// orders and app/(public-hub)/p/[code]).
async function mintPlaques(params: {
  db: ReturnType<typeof createServiceRoleClient>;
  tier: PlaqueTier;
  quantity: number;
  merchantId?: string | null;
  avisLinkId?: string;
  shopOrderId?: string;
  publicShopOrderId?: string;
}) {
  const { db, tier, quantity, merchantId, avisLinkId, shopOrderId, publicShopOrderId } = params;
  if (quantity <= 0) return;

  const rows = Array.from({ length: quantity }, () => ({
    tier,
    merchant_id: merchantId ?? null,
    avis_link_id: avisLinkId ?? null,
    shop_order_id: shopOrderId ?? null,
    public_shop_order_id: publicShopOrderId ?? null,
  }));
  await db.from("plaques").insert(rows);
}

// This Stripe API version ("2026-06-24.dahlia") moved an invoice's
// subscription reference off the top level onto parent.subscription_details.
function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const sub = invoice.parent?.subscription_details?.subscription;
  if (!sub) return null;
  return typeof sub === "string" ? sub : sub.id;
}

async function isPlaqueProSubscription(db: ReturnType<typeof createServiceRoleClient>, subscriptionId: string): Promise<boolean> {
  const { data } = await db
    .from("merchant_plaque_subscriptions")
    .select("merchant_id")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();
  return Boolean(data);
}

async function syncPlaqueSubscription(db: ReturnType<typeof createServiceRoleClient>, subscription: Stripe.Subscription) {
  const merchantId = subscription.metadata?.merchant_id;
  if (!merchantId) return;

  await db.from("merchant_plaque_subscriptions").upsert(
    {
      merchant_id: merchantId,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      stripe_subscription_item_id: subscription.items.data[0]?.id ?? null,
      billing_interval: subscription.items.data[0]?.price.recurring?.interval === "year" ? "year" : "month",
      status: resolveSubscriptionStatus(subscription),
      current_period_end: subscription.items.data[0]?.current_period_end
        ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "merchant_id" }
  );
}

// The Pro-tier checkout combines a one-time hardware line item with a
// recurring subscription price (mode: "subscription") — see
// app/api/boutique/nfc-checkout. Kept entirely separate from
// activateSubscriptionFromSetup/syncSubscription above, which manage the
// unrelated core metered loyalty subscription on the same merchants row.
async function processPlaqueProCheckout(db: ReturnType<typeof createServiceRoleClient>, session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id;
  const merchantId = session.metadata?.merchant_id;
  const subscriptionId = session.subscription as string | null;
  if (!orderId || !merchantId || !subscriptionId) return;

  const { data: order } = await db
    .from("shop_orders")
    .update({ status: "paid", stripe_checkout_session_id: session.id })
    .eq("id", orderId)
    .select("id, items")
    .single();
  if (!order) return;

  const subscription = await stripe().subscriptions.retrieve(subscriptionId);
  await syncPlaqueSubscription(db, subscription);
  await mintPlaques({ db, tier: "pro", merchantId, shopOrderId: order.id, quantity: itemsQuantity(order.items as ShopOrderItem[]) });

  const { data: merchant } = await db.from("merchants").select("business_name, auth_user_id").eq("id", merchantId).single();
  if (!merchant) return;
  const { data: userResult } = await db.auth.admin.getUserById(merchant.auth_user_id);
  const merchantEmail = userResult.user?.email;
  if (merchantEmail) {
    await sendEmail(
      merchantEmail,
      "Votre abonnement Fidély Plaque Pro est actif",
      `<p>Bonjour,</p><p>Votre abonnement Pro pour <strong>${merchant.business_name}</strong> est actif : modifications illimitées et menu multilingue sur toutes vos plaques Présence/Pro.</p>`
    );
  }
}
