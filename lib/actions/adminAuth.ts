"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/adminAudit";

export interface AdminAuthActionState {
  error?: string;
}

// Real Supabase Auth sign-in, gated by platform_admins membership — same
// credentials as a merchant's dashboard login could use, but only accounts
// explicitly added to platform_admins get past this check. Deliberately
// vague error message on rejection so a leaked/guessed merchant email
// doesn't confirm whether it has admin access.
export async function adminSignIn(
  _prevState: AdminAuthActionState,
  formData: FormData
): Promise<AdminAuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email et mot de passe requis." };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: "Identifiants invalides." };
  }

  const db = createServiceRoleClient();
  const { data: adminRow } = await db
    .from("platform_admins")
    .select("auth_user_id")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();

  if (!adminRow) {
    await supabase.auth.signOut();
    return { error: "Identifiants invalides." };
  }

  await logAdminAction(db, data.user.id, "sign_in");
  redirect("/admin");
}

export async function adminSignOut() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
