"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { onboardingSchema } from "@/lib/validation/schemas";
import { isStripeConfigured } from "@/lib/env";
import { stripe } from "@/lib/stripe/client";

export interface OnboardingState {
  error?: string;
}

export async function completeOnboarding(
  _prevState: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const authed = await createServerSupabaseClient();
  const {
    data: { user },
  } = await authed.auth.getUser();

  if (!user) redirect("/login");

  const parsed = onboardingSchema.safeParse({
    businessName: formData.get("businessName"),
    slug: formData.get("slug"),
    brandColor: formData.get("brandColor") || undefined,
    pointsPerScan: formData.get("pointsPerScan") || undefined,
    rewardThreshold: formData.get("rewardThreshold"),
    rewardDescription: formData.get("rewardDescription"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const { businessName, slug, brandColor, pointsPerScan, rewardThreshold, rewardDescription } =
    parsed.data;

  // Onboarding creates merchants/merchant_staff rows, which have no
  // client-facing insert RLS policy (chicken-and-egg: is_merchant_staff()
  // can't pass before the membership row exists). Use the service-role
  // client, scoped explicitly to the authenticated user's id from the
  // trusted session above.
  const db = createServiceRoleClient();

  const { data: existing } = await db
    .from("merchants")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    return { error: "Ce lien (slug) est déjà utilisé, choisissez-en un autre." };
  }

  const { data: merchant, error: merchantError } = await db
    .from("merchants")
    .insert({
      auth_user_id: user.id,
      business_name: businessName,
      slug,
      brand_color: brandColor,
      onboarding_completed: true,
    })
    .select("id")
    .single();

  if (merchantError || !merchant) {
    return { error: merchantError?.message ?? "Impossible de créer le commerce." };
  }

  const { error: staffError } = await db.from("merchant_staff").insert({
    merchant_id: merchant.id,
    auth_user_id: user.id,
    role: "owner",
  });

  if (staffError) {
    return { error: staffError.message };
  }

  const { error: programError } = await db.from("loyalty_programs").insert({
    merchant_id: merchant.id,
    name: businessName,
    points_per_scan: pointsPerScan,
    reward_threshold: rewardThreshold,
    reward_description: rewardDescription,
  });

  if (programError) {
    return { error: programError.message };
  }

  // Best-effort: create the Stripe customer now so /dashboard/billing can
  // immediately offer Checkout. Not fatal if Stripe isn't configured yet or
  // the API call fails — the billing page creates one lazily otherwise.
  if (isStripeConfigured) {
    try {
      const customer = await stripe().customers.create({
        email: user.email,
        name: businessName,
        metadata: { merchant_id: merchant.id },
      });
      await db
        .from("merchants")
        .update({ stripe_customer_id: customer.id })
        .eq("id", merchant.id);
    } catch (err) {
      console.error("Failed to create Stripe customer during onboarding", err);
    }
  }

  redirect("/dashboard");
}
