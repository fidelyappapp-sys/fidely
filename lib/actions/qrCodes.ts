"use server";

import { revalidatePath } from "next/cache";
import { requireMerchantContext } from "@/lib/merchant";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { qrCodeSchema } from "@/lib/validation/schemas";

export interface QrCodeActionState {
  error?: string;
  success?: boolean;
}

export async function addQrCode(
  _prevState: QrCodeActionState,
  formData: FormData
): Promise<QrCodeActionState> {
  const merchant = await requireMerchantContext();
  if (merchant.role !== "owner") {
    return { error: "Seul le propriétaire peut créer des QR codes." };
  }

  const parsed = qrCodeSchema.safeParse({
    label: formData.get("label"),
    targetUrl: formData.get("targetUrl"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("merchant_qr_codes").insert({
    merchant_id: merchant.merchantId,
    label: parsed.data.label,
    target_url: parsed.data.targetUrl,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/qr-codes");
  return { success: true };
}

export async function deleteQrCode(
  _prevState: QrCodeActionState,
  formData: FormData
): Promise<QrCodeActionState> {
  const merchant = await requireMerchantContext();
  if (merchant.role !== "owner") {
    return { error: "Seul le propriétaire peut supprimer un QR code." };
  }

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Identifiant manquant." };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("merchant_qr_codes")
    .delete()
    .eq("id", id)
    .eq("merchant_id", merchant.merchantId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/qr-codes");
  return { success: true };
}

// Rotates one employee's personal scan link, invalidating any QR code
// printed for the old one (lost badge, staff turnover, ...).
export async function regenerateStaffScanTokenFormAction(staffId: string): Promise<void> {
  const merchant = await requireMerchantContext();
  if (merchant.role !== "owner") return;

  const db = createServiceRoleClient();
  await db
    .from("merchant_staff")
    .update({ scan_token: crypto.randomUUID().replace(/-/g, "") })
    .eq("id", staffId)
    .eq("merchant_id", merchant.merchantId);

  revalidatePath("/dashboard/qr-codes");
}
