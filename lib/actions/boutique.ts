"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireMerchantContext, ACTIVE_MERCHANT_COOKIE } from "@/lib/merchant";
import { addMerchantSchema } from "@/lib/validation/schemas";
import { stripe } from "@/lib/stripe/client";
import { isStripeConfigured, appBaseUrl } from "@/lib/env";
import { NEW_SHOP_KIT_PRODUCT } from "@/lib/boutique";

export interface AddMerchantState {
  error?: string;
}

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Adds a second (or third...) commerce to the same account: creates the
// merchants/merchant_staff/loyalty_programs rows (same shape as onboarding,
// see lib/actions/onboarding.ts), switches the active-merchant cookie to
// it, then auto-orders + redirects straight to Stripe Checkout for the
// "pack nouveau commerce" kit — "configuration incluse" means a sensible
// default loyalty program, not another form to fill in.
export async function createAdditionalMerchant(
  _prev: AddMerchantState,
  formData: FormData
): Promise<AddMerchantState> {
  const merchant = await requireMerchantContext();
  if (merchant.role !== "owner") return { error: "Réservé au propriétaire du commerce." };

  const parsed = addMerchantSchema.safeParse({
    businessName: formData.get("businessName"),
    address: formData.get("address"),
    businessType: formData.get("businessType"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  const db = createServiceRoleClient();

  let slug = slugify(parsed.data.businessName) || `commerce-${Date.now()}`;
  const { data: existingSlug } = await db.from("merchants").select("id").eq("slug", slug).maybeSingle();
  if (existingSlug) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  const { data: newMerchant, error: merchantError } = await db
    .from("merchants")
    .insert({
      auth_user_id: merchant.userId,
      business_name: parsed.data.businessName,
      slug,
      address: parsed.data.address,
      business_type: parsed.data.businessType,
      onboarding_completed: true,
    })
    .select("id")
    .single();

  if (merchantError || !newMerchant) {
    return { error: merchantError?.message ?? "Impossible de créer le commerce." };
  }

  const { error: staffError } = await db.from("merchant_staff").insert({
    merchant_id: newMerchant.id,
    auth_user_id: merchant.userId,
    role: "owner",
  });
  if (staffError) return { error: staffError.message };

  await db.from("loyalty_programs").insert({
    merchant_id: newMerchant.id,
    name: parsed.data.businessName,
    points_per_scan: 1,
    reward_threshold: 10,
    reward_description: "Une récompense à définir dans le programme de fidélité",
  });

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_MERCHANT_COOKIE, newMerchant.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  });

  if (!isStripeConfigured) redirect("/dashboard");

  const priceId = process.env[NEW_SHOP_KIT_PRODUCT.priceEnvVar];
  if (!priceId) redirect("/dashboard");

  const { data: order } = await db
    .from("shop_orders")
    .insert({
      merchant_id: newMerchant.id,
      items: [
        {
          key: NEW_SHOP_KIT_PRODUCT.key,
          label: NEW_SHOP_KIT_PRODUCT.label,
          quantity: 1,
          unitAmountCents: NEW_SHOP_KIT_PRODUCT.amountCents,
        },
      ],
      amount_cents: NEW_SHOP_KIT_PRODUCT.amountCents,
      delivery_method: "hand_delivery",
    })
    .select("id")
    .single();

  const customer = await stripe().customers.create({
    name: parsed.data.businessName,
    metadata: { merchant_id: newMerchant.id },
  });
  await db.from("merchants").update({ stripe_customer_id: customer.id }).eq("id", newMerchant.id);

  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    customer: customer.id,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { type: "boutique_order", order_id: order?.id ?? "", merchant_id: newMerchant.id },
    success_url: `${appBaseUrl()}/dashboard?newCommerce=success`,
    cancel_url: `${appBaseUrl()}/boutique`,
  });

  redirect(session.url!);
}
