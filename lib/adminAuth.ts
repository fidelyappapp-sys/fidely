import { redirect } from "next/navigation";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";

export interface AdminContext {
  authUserId: string;
  email: string | null;
}

// Platform-admin access is a real Supabase Auth session (same login as the
// merchant dashboard) plus membership in platform_admins — replaces the
// old single shared-password cookie (ADMIN_PASSWORD/ADMIN_SESSION_SECRET),
// which had no per-admin identity and so couldn't be attributed in an audit
// log. Every admin page under app/admin/(protected) calls this first.
export async function requireAdminContext(): Promise<AdminContext> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const db = createServiceRoleClient();
  const { data: adminRow } = await db
    .from("platform_admins")
    .select("auth_user_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!adminRow) redirect("/admin/login");

  return { authUserId: user.id, email: user.email ?? null };
}

// Same lookup, but returns null instead of redirecting — for the login
// action, which needs to reject non-admin accounts without Next's redirect()
// (that throws, which useActionState can't turn into a form error message).
export async function getAdminContextOrNull(): Promise<AdminContext | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const db = createServiceRoleClient();
  const { data: adminRow } = await db
    .from("platform_admins")
    .select("auth_user_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!adminRow) return null;
  return { authUserId: user.id, email: user.email ?? null };
}
