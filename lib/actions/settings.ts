"use server";

import { revalidatePath } from "next/cache";
import { requireMerchantContext } from "@/lib/merchant";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { openingHoursSchema, settingsSchema } from "@/lib/validation/schemas";

export interface SettingsActionState {
  error?: string;
  success?: boolean;
}

export async function updateMerchantSettings(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const merchant = await requireMerchantContext();

  const parsed = settingsSchema.safeParse({
    googleMapsLink: formData.get("googleMapsLink"),
    googleReviewLink: formData.get("googleReviewLink"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("merchants")
    .update({
      google_maps_link: parsed.data.googleMapsLink || null,
      google_review_link: parsed.data.googleReviewLink || null,
      phone: parsed.data.phone || null,
    })
    .eq("id", merchant.merchantId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  revalidatePath("/c", "layout");
  return { success: true };
}

export async function updateOpeningHours(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const merchant = await requireMerchantContext();

  const raw = formData.get("openingHours");
  let value: unknown;
  try {
    value = JSON.parse(typeof raw === "string" ? raw : "[]");
  } catch {
    return { error: "Horaires invalides." };
  }

  const parsed = openingHoursSchema.safeParse(value);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Horaires invalides." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("merchants")
    .update({ opening_hours: parsed.data })
    .eq("id", merchant.merchantId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  revalidatePath("/c", "layout");
  return { success: true };
}
