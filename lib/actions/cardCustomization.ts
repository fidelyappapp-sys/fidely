"use server";

import { revalidatePath } from "next/cache";
import { requireMerchantContext } from "@/lib/merchant";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { uploadMerchantCardAsset } from "@/lib/storage";
import { cardCustomizationSchema } from "@/lib/validation/schemas";
import type { Database } from "@/lib/supabase/types";

type MerchantUpdate = Database["public"]["Tables"]["merchants"]["Update"];

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
    textColor: formData.get("textColor"),
    stampStyle: formData.get("stampStyle"),
    sector: formData.get("sector"),
    backgroundPhotoEnabled: formData.get("backgroundPhotoEnabled"),
    nameDisplayMode: formData.get("nameDisplayMode"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const update: MerchantUpdate = {
    brand_color: parsed.data.brandColor,
    text_color: parsed.data.textColor,
    stamp_style: parsed.data.stampStyle,
    sector: parsed.data.sector || null,
    background_photo_enabled: parsed.data.backgroundPhotoEnabled ?? false,
    // If "logo" is chosen but no logo exists yet (nothing uploaded now, none
    // saved before), the card/public page fall back to text automatically —
    // no need to block the save on it here.
    name_display_mode: parsed.data.nameDisplayMode,
  };

  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    try {
      update.logo_url = await uploadMerchantCardAsset(merchant.merchantId, logo, "logo");
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Échec de l'envoi du logo." };
    }
  }

  const backgroundPhoto = formData.get("backgroundPhoto");
  if (backgroundPhoto instanceof File && backgroundPhoto.size > 0) {
    try {
      update.background_photo_url = await uploadMerchantCardAsset(
        merchant.merchantId,
        backgroundPhoto,
        "background"
      );
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Échec de l'envoi de la photo." };
    }
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("merchants").update(update).eq("id", merchant.merchantId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/program");
  revalidatePath("/c", "layout");
  return { success: true };
}
