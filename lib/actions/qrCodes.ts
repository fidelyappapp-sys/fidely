"use server";

import { revalidatePath } from "next/cache";
import { requireMerchantContext } from "@/lib/merchant";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { qrCodeSchema, createPointOfSaleSchema, updatePointOfSaleCitySchema } from "@/lib/validation/schemas";
import { buildJoinUrl } from "@/lib/env";
import type { ProgramActionState } from "@/lib/actions/program";
import { resyncPointOfSaleCity } from "@/lib/wallet/resync";

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

// A new point of sale: same real join/wallet behavior as the main
// "Rejoindre" QR, but with its own city and its own dedicated loyalty
// program (mandatory at creation, same as the merchant's own onboarding —
// see createPointOfSaleSchema). Two inserts, no cross-table transaction
// available here (same convention as the rest of this codebase, e.g. the
// join route's customer/card creation) — the program is best-effort cleaned
// up if the point-of-sale insert fails.
export async function createPointOfSale(
  _prevState: ProgramActionState,
  formData: FormData
): Promise<ProgramActionState> {
  const merchant = await requireMerchantContext();
  if (merchant.role !== "owner") {
    return { error: "Seul le propriétaire peut créer un point de vente." };
  }

  const parsed = createPointOfSaleSchema.safeParse({
    displayMode: formData.get("displayMode"),
    label: formData.get("label"),
    city: formData.get("city"),
    name: formData.get("name"),
    pointsPerScan: formData.get("pointsPerScan"),
    stampCount: formData.get("stampCount"),
    pointsPerEuro: formData.get("pointsPerEuro"),
    rewardThreshold: formData.get("rewardThreshold"),
    rewardDescription: formData.get("rewardDescription"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = await createServerSupabaseClient();

  // Two explicit .insert() calls rather than a shared variable — passing a
  // union of the two display_mode shapes into a single .insert() defeats
  // postgrest-js's excess-property checking (it can't distribute over a
  // union), same reasoning as updateProgram in lib/actions/program.ts.
  const { data: program, error: programError } =
    parsed.data.displayMode === "stamps"
      ? await supabase
          .from("loyalty_programs")
          .insert({
            merchant_id: merchant.merchantId,
            display_mode: "stamps",
            name: parsed.data.name,
            points_per_scan: parsed.data.pointsPerScan,
            stamp_count: parsed.data.stampCount,
            reward_threshold: parsed.data.rewardThreshold,
            reward_description: parsed.data.rewardDescription,
          })
          .select("id")
          .single()
      : await supabase
          .from("loyalty_programs")
          .insert({
            merchant_id: merchant.merchantId,
            display_mode: "points",
            name: parsed.data.name,
            points_per_euro: parsed.data.pointsPerEuro,
            reward_threshold: parsed.data.rewardThreshold,
            reward_description: parsed.data.rewardDescription,
          })
          .select("id")
          .single();

  if (programError || !program) {
    return { error: programError?.message ?? "Impossible de créer le programme de fidélité." };
  }

  const { data: qr, error: qrError } = await supabase
    .from("merchant_qr_codes")
    .insert({
      merchant_id: merchant.merchantId,
      label: parsed.data.label,
      city: parsed.data.city,
      target_url: "",
      kind: "join_source",
      loyalty_program_id: program.id,
    })
    .select("id")
    .single();

  if (qrError || !qr) {
    await supabase.from("loyalty_programs").delete().eq("id", program.id);
    return { error: qrError?.message ?? "Impossible de créer le point de vente." };
  }

  const { error: updateError } = await supabase
    .from("merchant_qr_codes")
    .update({ target_url: buildJoinUrl(merchant.slug, qr.id) })
    .eq("id", qr.id);

  if (updateError) return { error: updateError.message };

  revalidatePath("/dashboard/qr-codes");
  return { success: true };
}

// Editable after the fact from the QR codes page — lets the merchant fix up
// the "main" point of sale's city once it's been backfilled empty (see
// supabase/migrations/0023_points_of_sale.sql), or correct any other point
// of sale's city later. Re-pushes the new city to already-issued wallet
// passes for cards attached to this point of sale (see resyncPointOfSaleCity
// — Apple always refetches fresh, Google needs the field explicitly patched).
export async function updatePointOfSaleCity(
  _prevState: QrCodeActionState,
  formData: FormData
): Promise<QrCodeActionState> {
  const merchant = await requireMerchantContext();
  if (merchant.role !== "owner") {
    return { error: "Seul le propriétaire peut modifier un point de vente." };
  }

  const parsed = updatePointOfSaleCitySchema.safeParse({
    id: formData.get("id"),
    city: formData.get("city"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("merchant_qr_codes")
    .update({ city: parsed.data.city })
    .eq("id", parsed.data.id)
    .eq("merchant_id", merchant.merchantId);

  if (error) return { error: error.message };

  await resyncPointOfSaleCity(parsed.data.id, parsed.data.city);

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
