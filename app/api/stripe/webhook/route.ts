import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { createServiceRoleClient } from "@/lib/supabase/server";

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
      if (session.customer && session.subscription) {
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
          subscription_status: subscription.status,
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
      subscription_status: subscription.status,
    })
    .eq("stripe_customer_id", customerId);
}
