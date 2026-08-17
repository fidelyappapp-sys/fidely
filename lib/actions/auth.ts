"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { appBaseUrl } from "@/lib/env";

export interface AuthActionState {
  error?: string;
}

export async function signUpWithPassword(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState & { sent?: boolean }> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || password.length < 8) {
    return { error: "Adresse email invalide ou mot de passe trop court (8 caractères min)." };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${appBaseUrl()}/auth/confirm?next=/onboarding` },
  });

  if (error) return { error: error.message };

  // No session means email confirmation is required (or, if this address
  // was already used, Supabase's signUp responds identically — a session
  // here — rather than an error, to avoid leaking which emails are
  // registered). Redirecting straight to /onboarding in that case would
  // silently bounce the user back out with zero feedback, since there's no
  // authenticated session yet — show a clear "check your email" message
  // instead of the blind redirect.
  if (!data.session) {
    return { sent: true };
  }

  redirect("/onboarding");
}

export async function signInWithPassword(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return {
        error:
          "Votre email n'est pas encore confirmé. Vérifiez votre boîte mail et cliquez sur le lien de confirmation.",
      };
    }
    return { error: "Email ou mot de passe incorrect." };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function sendMagicLink(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState & { sent?: boolean }> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Adresse email requise." };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${appBaseUrl()}/auth/confirm?next=/dashboard` },
  });

  if (error) return { error: error.message };

  return { sent: true };
}

export async function requestPasswordReset(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState & { sent?: boolean }> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Adresse email requise." };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appBaseUrl()}/auth/confirm?next=/reset-password`,
  });

  if (error) return { error: error.message };

  return { sent: true };
}

export async function updatePassword(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const password = String(formData.get("password") ?? "");

  if (password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) return { error: error.message };

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}
