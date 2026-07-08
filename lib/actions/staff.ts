"use server";

import { revalidatePath } from "next/cache";
import { requireMerchantContext } from "@/lib/merchant";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { appBaseUrl } from "@/lib/env";

export interface StaffActionState {
  error?: string;
  success?: boolean;
}

export async function inviteStaffMember(
  _prevState: StaffActionState,
  formData: FormData
): Promise<StaffActionState> {
  const merchant = await requireMerchantContext();
  if (merchant.role !== "owner") {
    return { error: "Seul le propriétaire peut inviter des membres." };
  }

  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Adresse email requise." };

  const db = createServiceRoleClient();

  const { data: invited, error: inviteError } = await db.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${appBaseUrl()}/dashboard`,
  });

  if (inviteError || !invited.user) {
    return { error: inviteError?.message ?? "Impossible d'inviter ce membre." };
  }

  const { error: staffError } = await db.from("merchant_staff").insert({
    merchant_id: merchant.merchantId,
    auth_user_id: invited.user.id,
    role: "staff",
  });

  if (staffError) {
    return { error: staffError.message };
  }

  revalidatePath("/dashboard/staff");
  return { success: true };
}

export async function removeStaffMember(staffId: string): Promise<StaffActionState> {
  const merchant = await requireMerchantContext();
  if (merchant.role !== "owner") {
    return { error: "Seul le propriétaire peut retirer des membres." };
  }

  const db = createServiceRoleClient();
  const { error } = await db
    .from("merchant_staff")
    .delete()
    .eq("id", staffId)
    .eq("merchant_id", merchant.merchantId)
    .eq("role", "staff");

  if (error) return { error: error.message };

  revalidatePath("/dashboard/staff");
  return { success: true };
}

// Form-action-friendly wrapper: <form action={...}> requires a function
// returning void/Promise<void>, but removeStaffMember returns state for
// potential future inline error display — this discards it.
export async function removeStaffMemberFormAction(staffId: string): Promise<void> {
  await removeStaffMember(staffId);
}
