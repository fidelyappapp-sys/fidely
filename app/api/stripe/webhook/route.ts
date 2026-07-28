import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendOrderConfirmationEmail, sendAdminOrderNotification } from "@/lib/email";
import { recordInvoiceFromStripeEvent } from "@/lib/invoicing";
import type { KitShippingAddress, ShopOrderItem } from "@/lib/supabase/types";

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
      await db
        .from("merchants")
        .update({
          stripe_subscription_id: subscription.id,
          stripe_subscription_item_id: subscription.items.data[0]?.id ?? null,
          subscription_status: resolveSubscriptionStatus(subscription),
        })
        .eq("stripe_customer_id", subscription.customer as string);
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await db
        .from("merchants")
        .update({ subscription_status: "canceled", subscription_canceled_at: new Date().toISOString() })
        .eq("stripe_customer_id", subscription.customer as string);
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.customer) {
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
      if (invoice.customer) {
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
    .select("id, merchant_id, items, amount_cents, delivery_method, shipping_address")
    .single();

  if (!order) return;

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

// Stripe's own subscription.status stays "active" while pause_collection is
// set (pausing billing doesn't change the subscription's lifecycle status),
// so a naive sync would silently un-pause a merchant the moment any
// customer.subscription.updated event arrives. Treat pause_collection as
// the source of truth for our "paused" app-level status instead.
function resolveSubscriptionStatus(subscription: Stripe.Subscription): string {
  return subscription.pause_collection ? "paused" : subscription.status;
}
