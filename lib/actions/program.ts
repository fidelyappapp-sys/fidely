"use server";

import { revalidatePath } from "next/cache";
import { requireMerchantContext } from "@/lib/merchant";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { programUpdateSchema } from "@/lib/validation/schemas";

export interface ProgramActionState {
  error?: string;
  success?: boolean;
}

export async function updateProgram(
  _prevState: ProgramActionState,
  formData: FormData
): Promise<ProgramActionState> {
  const merchant = await requireMerchantContext();

  const parsed = programUpdateSchema.safeParse({
    name: formData.get("name"),
    pointsPerScan: formData.get("pointsPerScan"),
    rewardThreshold: formData.get("rewardThreshold"),
    rewardDescription: formData.get("rewardDescription"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("loyalty_programs")
    .update({
      name: parsed.data.name,
      points_per_scan: parsed.data.pointsPerScan,
      reward_threshold: parsed.data.rewardThreshold,
      reward_description: parsed.data.rewardDescription,
    })
    .eq("merchant_id", merchant.merchantId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/program");
  return { success: true };
}
