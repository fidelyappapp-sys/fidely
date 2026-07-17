"use server";

import { revalidatePath } from "next/cache";
import { requireMerchantContext } from "@/lib/merchant";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { galleryPhotoSchema, menuItemSchema } from "@/lib/validation/schemas";

export interface PageContentActionState {
  error?: string;
  success?: boolean;
}

export async function addMenuItem(
  _prevState: PageContentActionState,
  formData: FormData
): Promise<PageContentActionState> {
  const merchant = await requireMerchantContext();

  const parsed = menuItemSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    priceCents: formData.get("priceCents") || undefined,
    photoUrl: formData.get("photoUrl"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("merchant_menu_items").insert({
    merchant_id: merchant.merchantId,
    name: parsed.data.name,
    description: parsed.data.description || null,
    price_cents: parsed.data.priceCents ?? null,
    photo_url: parsed.data.photoUrl || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  revalidatePath("/c", "layout");
  return { success: true };
}

export async function deleteMenuItem(
  _prevState: PageContentActionState,
  formData: FormData
): Promise<PageContentActionState> {
  const merchant = await requireMerchantContext();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Identifiant manquant." };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("merchant_menu_items")
    .delete()
    .eq("id", id)
    .eq("merchant_id", merchant.merchantId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  revalidatePath("/c", "layout");
  return { success: true };
}

export async function addGalleryPhoto(
  _prevState: PageContentActionState,
  formData: FormData
): Promise<PageContentActionState> {
  const merchant = await requireMerchantContext();

  const parsed = galleryPhotoSchema.safeParse({ url: formData.get("url") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Lien invalide." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("merchant_gallery_photos").insert({
    merchant_id: merchant.merchantId,
    url: parsed.data.url,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  revalidatePath("/c", "layout");
  return { success: true };
}

export async function deleteGalleryPhoto(
  _prevState: PageContentActionState,
  formData: FormData
): Promise<PageContentActionState> {
  const merchant = await requireMerchantContext();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Identifiant manquant." };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("merchant_gallery_photos")
    .delete()
    .eq("id", id)
    .eq("merchant_id", merchant.merchantId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  revalidatePath("/c", "layout");
  return { success: true };
}
