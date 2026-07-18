"use server";

import { revalidatePath } from "next/cache";
import { requireMerchantContext } from "@/lib/merchant";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cardCustomizationSchema } from "@/lib/validation/schemas";

export interface CardCustomizationState {
  error?: string;
  success?: boolean;
}

export async function updateCardCustomization(
  _prevState: CardCustomizationState,
  formData: FormData
): Promise<CardCustomizationState> {
  const merchant = await requireMerchantContext();
  if (merchant.role !== "owner") {
    return { error: "Seul le propriétaire peut personnaliser la carte." };
  }

  const parsed = cardCustomizationSchema.safeParse({
    brandColor: formData.get("brandColor"),
    stampStyle: formData.get("stampStyle"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("merchants")
    .update({ brand_color: parsed.data.brandColor, stamp_style: parsed.data.stampStyle })
    .eq("id", merchant.merchantId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/program");
  revalidatePath("/c", "layout");
  return { success: true };
}
