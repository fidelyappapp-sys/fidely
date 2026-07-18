"use server";

import { revalidatePath } from "next/cache";
import { requireMerchantContext } from "@/lib/merchant";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { employeeSchema } from "@/lib/validation/schemas";

export interface StaffActionState {
  error?: string;
  success?: boolean;
}

// Employees don't get a Supabase Auth account: they're identified by name
// and a personal scan_token (see lib/staffScanAuth.ts) that lets them pick
// up a shared counter device via their own QR — no login required.
export async function addEmployee(
  _prevState: StaffActionState,
  formData: FormData
): Promise<StaffActionState> {
  const merchant = await requireMerchantContext();
  if (merchant.role !== "owner") {
    return { error: "Seul le propriétaire peut ajouter un employé." };
  }

  const parsed = employeeSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const db = createServiceRoleClient();
  const { error } = await db.from("merchant_staff").insert({
    merchant_id: merchant.merchantId,
    role: "staff",
    first_name: parsed.data.firstName,
    last_name: parsed.data.lastName,
    active: true,
    scan_token: crypto.randomUUID().replace(/-/g, ""),
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/staff");
  return { success: true };
}

// One click "Supprimer": deactivates immediately (clears scan_token, so any
// printed QR stops working right away) rather than a hard delete, so the
// employee still shows up in the inactive list below.
export async function deactivateEmployee(staffId: string): Promise<void> {
  const merchant = await requireMerchantContext();
  if (merchant.role !== "owner") return;

  const db = createServiceRoleClient();
  await db
    .from("merchant_staff")
    .update({ active: false, scan_token: null })
    .eq("id", staffId)
    .eq("merchant_id", merchant.merchantId)
    .eq("role", "staff");

  revalidatePath("/dashboard/staff");
}
