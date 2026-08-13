"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { onboardingInfosSchema } from "@/lib/validation/schemas";
import { isStripeConfigured, buildJoinUrl } from "@/lib/env";
import { stripe } from "@/lib/stripe/client";
import { requireMerchantContext } from "@/lib/merchant";
import { updateCardCustomization, type CardCustomizationState } from "@/lib/actions/cardCustomization";
import { updateProgram, type ProgramActionState } from "@/lib/actions/program";

export interface OnboardingState {
  error?: string;
}

// Step 1 — creates the merchant in draft form (onboarding_completed: false)
// with just enough to move on. Brand color, logo, sector, program mode and
// reward are all filled in on the next two steps, which edit this same row
// via the exact same actions/components used later in the dashboard
// (CardCustomizer, ProgramForm) — see saveOnboardingPersonalisation/
// saveOnboardingProgram below.
export async function createMerchantDraft(
  _prevState: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const authed = await createServerSupabaseClient();
  const {
    data: { user },
  } = await authed.auth.getUser();

  if (!user) redirect("/login");

  const parsed = onboardingInfosSchema.safeParse({
    ownerFirstName: formData.get("ownerFirstName"),
    ownerLastName: formData.get("ownerLastName"),
    ownerPhone: formData.get("ownerPhone"),
    businessName: formData.get("businessName"),
    slug: formData.get("slug"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const { ownerFirstName, ownerLastName, ownerPhone, businessName, slug } = parsed.data;

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
      owner_first_name: ownerFirstName,
      owner_last_name: ownerLastName,
      owner_phone: ownerPhone,
      onboarding_completed: false,
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

  // reward_threshold/reward_description have no DB default (unlike
  // display_mode/stamp_count/points_per_scan) — placeholder values here,
  // required to be replaced with something real by saveOnboardingProgram's
  // validation (programUpdateSchema requires reward_description.min(2))
  // before onboarding_completed can flip to true.
  const { data: program, error: programError } = await db
    .from("loyalty_programs")
    .insert({
      merchant_id: merchant.id,
      name: businessName,
      reward_threshold: 10,
      reward_description: "",
    })
    .select("id")
    .single();

  if (programError || !program) {
    return { error: programError?.message ?? "Impossible de créer le programme de fidélité." };
  }

  // The "main" point of sale — historically just a virtual /join/<slug> URL,
  // now a real row so it can carry a city and a dedicated program like any
  // other point of sale (see supabase/migrations/0023_points_of_sale.sql).
  const { error: posError } = await db.from("merchant_qr_codes").insert({
    merchant_id: merchant.id,
    label: "Point de vente principal",
    target_url: buildJoinUrl(slug),
    kind: "main",
    loyalty_program_id: program.id,
  });

  if (posError) {
    return { error: posError.message };
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

  redirect("/onboarding/personnalisation");
}

// Step 2 — thin wrapper around the same action the dashboard's card
// customizer uses, so the two never drift apart. Only difference here is
// where it sends the merchant next.
export async function saveOnboardingPersonalisation(
  prevState: CardCustomizationState,
  formData: FormData
): Promise<CardCustomizationState> {
  const result = await updateCardCustomization(prevState, formData);
  if (result.error) return result;
  redirect("/onboarding/programme");
}

// Step 3 — same idea, wrapping the dashboard's program form action, then
// flipping onboarding_completed once a real reward has been saved. Dashboard
// access unlocks right here; step 4 (notifications) is a one-screen teaser
// with nothing to configure, not a gate — skipping it costs nothing.
export async function saveOnboardingProgram(
  prevState: ProgramActionState,
  formData: FormData
): Promise<ProgramActionState> {
  const result = await updateProgram(prevState, formData);
  if (result.error) return result;

  const merchant = await requireMerchantContext();
  const db = createServiceRoleClient();
  await db.from("merchants").update({ onboarding_completed: true }).eq("id", merchant.merchantId);

  redirect("/onboarding/notifications");
}
