"use server";

import { redirect } from "next/navigation";
import { verifyAdminPassword, createAdminSession, clearAdminSession } from "@/lib/adminAuth";

export interface AdminAuthActionState {
  error?: string;
}

export async function adminSignIn(
  _prevState: AdminAuthActionState,
  formData: FormData
): Promise<AdminAuthActionState> {
  const password = String(formData.get("password") ?? "");

  if (!verifyAdminPassword(password)) {
    return { error: "Mot de passe incorrect." };
  }

  await createAdminSession();
  redirect("/admin");
}

export async function adminSignOut() {
  await clearAdminSession();
  redirect("/admin/login");
}
