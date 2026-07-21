"use server";

import { revalidatePath } from "next/cache";
import { requireMerchantContext } from "@/lib/merchant";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";

export interface BillingMutationState {
  error?: string;
}

async function getSubscriptionId(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  merchantId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("merchants")
    .select("stripe_subscription_id")
    .eq("id", merchantId)
    .single();
  return data?.stripe_subscription_id ?? null;
}

export async function pauseSubscription(
  _prev: BillingMutationState,
  _formData: FormData
): Promise<BillingMutationState> {
  const merchant = await requireMerchantContext();
  if (merchant.role !== "owner") return { error: "Réservé au propriétaire du commerce." };
  if (merchant.subscriptionStatus !== "active") return { error: "Aucun abonnement actif à mettre en pause." };

  const supabase = await createServerSupabaseClient();
  const subscriptionId = await getSubscriptionId(supabase, merchant.merchantId);
  if (!subscriptionId) return { error: "Aucun abonnement Stripe associé." };

  await stripe().subscriptions.update(subscriptionId, { pause_collection: { behavior: "void" } });

  const pauseEndsAt = new Date();
  pauseEndsAt.setMonth(pauseEndsAt.getMonth() + 3);

  await supabase
    .from("merchants")
    .update({
      subscription_status: "paused",
      subscription_paused_at: new Date().toISOString(),
      subscription_pause_ends_at: pauseEndsAt.toISOString(),
      pause_reminder_sent_at: null,
    })
    .eq("id", merchant.merchantId);

  revalidatePath("/dashboard/billing");
  revalidatePath("/dashboard");
  return {};
}

export async function resumeSubscription(
  _prev: BillingMutationState,
  _formData: FormData
): Promise<BillingMutationState> {
  const merchant = await requireMerchantContext();
  if (merchant.role !== "owner") return { error: "Réservé au propriétaire du commerce." };
  if (merchant.subscriptionStatus !== "paused") return { error: "Cet abonnement n'est pas en pause." };

  const supabase = await createServerSupabaseClient();
  const subscriptionId = await getSubscriptionId(supabase, merchant.merchantId);
  if (!subscriptionId) return { error: "Aucun abonnement Stripe associé." };

  const subscription = await stripe().subscriptions.update(subscriptionId, { pause_collection: null });

  await supabase
    .from("merchants")
    .update({
      subscription_status: subscription.status,
      subscription_paused_at: null,
      subscription_pause_ends_at: null,
      pause_reminder_sent_at: null,
    })
    .eq("id", merchant.merchantId);

  revalidatePath("/dashboard/billing");
  revalidatePath("/dashboard");
  return {};
}

export async function cancelSubscription(
  _prev: BillingMutationState,
  _formData: FormData
): Promise<BillingMutationState> {
  const merchant = await requireMerchantContext();
  if (merchant.role !== "owner") return { error: "Réservé au propriétaire du commerce." };
  if (merchant.subscriptionStatus === "canceled") return {};

  const supabase = await createServerSupabaseClient();
  const subscriptionId = await getSubscriptionId(supabase, merchant.merchantId);
  if (subscriptionId) {
    await stripe().subscriptions.cancel(subscriptionId);
  }

  await supabase
    .from("merchants")
    .update({
      subscription_status: "canceled",
      subscription_canceled_at: new Date().toISOString(),
      subscription_paused_at: null,
      subscription_pause_ends_at: null,
    })
    .eq("id", merchant.merchantId);

  revalidatePath("/dashboard/billing");
  revalidatePath("/dashboard");
  return {};
}
