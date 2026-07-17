"use server";

import { revalidatePath } from "next/cache";
import { requireMerchantContext } from "@/lib/merchant";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { isStripeConfigured } from "@/lib/env";
import { kitDeliverySchema } from "@/lib/validation/schemas";
import type { KitShippingAddress } from "@/lib/supabase/types";

export interface KitDeliveryActionState {
  error?: string;
  success?: boolean;
}

const EXPRESS_SHIPPING_CENTS = 399;

export async function chooseKitDelivery(
  _prevState: KitDeliveryActionState,
  formData: FormData
): Promise<KitDeliveryActionState> {
  const merchant = await requireMerchantContext();

  const parsed = kitDeliverySchema.safeParse({
    method: formData.get("method"),
    shippingName: formData.get("shippingName"),
    shippingLine1: formData.get("shippingLine1"),
    shippingLine2: formData.get("shippingLine2"),
    shippingPostalCode: formData.get("shippingPostalCode"),
    shippingCity: formData.get("shippingCity"),
    shippingCountry: formData.get("shippingCountry") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = await createServerSupabaseClient();

  const address: KitShippingAddress | null =
    parsed.data.method === "hand_delivery"
      ? null
      : {
          name: parsed.data.shippingName,
          line1: parsed.data.shippingLine1,
          line2: parsed.data.shippingLine2 || "",
          postalCode: parsed.data.shippingPostalCode,
          city: parsed.data.shippingCity,
          country: parsed.data.shippingCountry,
        };

  let paymentIntentId: string | null = null;

  if (parsed.data.method === "express_shipping") {
    if (!isStripeConfigured) {
      return { error: "La facturation n'est pas encore configurée." };
    }

    const { data: merchantRow } = await supabase
      .from("merchants")
      .select("stripe_customer_id")
      .eq("id", merchant.merchantId)
      .single();

    if (!merchantRow?.stripe_customer_id) {
      return {
        error: "Activez d'abord la facturation (carte enregistrée) avant de choisir l'envoi express.",
      };
    }

    // Charges the card already on file, immediately, off-session. Validate
    // this in Stripe test mode (declined card, 3DS-required card) before
    // relying on it in production — same caveat as the metered price setup
    // in docs/STRIPE_SETUP.md.
    try {
      const intent = await stripe().paymentIntents.create({
        customer: merchantRow.stripe_customer_id,
        amount: EXPRESS_SHIPPING_CENTS,
        currency: "eur",
        off_session: true,
        confirm: true,
        description: "Fidély — kit de démarrage, envoi express",
        metadata: { merchant_id: merchant.merchantId, kind: "kit_express_shipping" },
      });
      paymentIntentId = intent.id;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Le paiement de 3,99€ a échoué.";
      return { error: `Paiement refusé : ${message}` };
    }
  }

  const { error } = await supabase
    .from("merchants")
    .update({
      kit_delivery_method: parsed.data.method,
      kit_shipping_address: address,
      kit_delivery_status: parsed.data.method === "hand_delivery" ? "pending" : "processing",
      kit_payment_intent_id: paymentIntentId,
    })
    .eq("id", merchant.merchantId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/kit-delivery");
  revalidatePath("/dashboard");
  return { success: true };
}
