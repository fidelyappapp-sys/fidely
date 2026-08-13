"use server";

import { revalidatePath } from "next/cache";
import { requireMerchantContext } from "@/lib/merchant";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { programUpdateSchema } from "@/lib/validation/schemas";
import { resyncMerchantProgramFields } from "@/lib/wallet/resync";

export interface ProgramActionState {
  error?: string;
  success?: boolean;
}

export async function updateProgram(
  _prevState: ProgramActionState,
  formData: FormData
): Promise<ProgramActionState> {
  const merchant = await requireMerchantContext();

  const programId = formData.get("programId");
  if (typeof programId !== "string" || !programId) {
    return { error: "Identifiant de programme manquant." };
  }

  const parsed = programUpdateSchema.safeParse({
    displayMode: formData.get("displayMode"),
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

  const update =
    parsed.data.displayMode === "stamps"
      ? {
          display_mode: "stamps" as const,
          name: parsed.data.name,
          points_per_scan: parsed.data.pointsPerScan,
          stamp_count: parsed.data.stampCount,
          reward_threshold: parsed.data.rewardThreshold,
          reward_description: parsed.data.rewardDescription,
        }
      : {
          display_mode: "points" as const,
          name: parsed.data.name,
          points_per_euro: parsed.data.pointsPerEuro,
          reward_threshold: parsed.data.rewardThreshold,
          reward_description: parsed.data.rewardDescription,
        };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("loyalty_programs")
    .update(update)
    // Scoped by id, not just merchant_id — a merchant can have several
    // programs now (one per point of sale), .eq("merchant_id", ...) alone
    // would silently update all of them at once.
    .eq("id", programId)
    .eq("merchant_id", merchant.merchantId);

  if (error) return { error: error.message };

  // Same reasoning as cardCustomization.ts's resync call — already-issued
  // passes don't pick up a changed reward/objectif/display mode on their
  // own. Scoped to this program's own cards only (see resyncMerchantProgramFields).
  await resyncMerchantProgramFields(programId, {
    displayMode: parsed.data.displayMode,
    rewardThreshold: parsed.data.rewardThreshold,
    rewardDescription: parsed.data.rewardDescription,
  });

  revalidatePath("/dashboard/program");
  return { success: true };
}
