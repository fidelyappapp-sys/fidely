import { createServiceRoleClient } from "@/lib/supabase/server";

type Db = ReturnType<typeof createServiceRoleClient>;

// The audit trail for anything a platform admin does across tenants —
// currently sign-ins and merchant detail views (the "view as" support flow,
// see app/admin/(protected)/merchants/[merchantId]/page.tsx). Best-effort:
// a logging failure should never block the admin action itself.
export async function logAdminAction(
  db: Db,
  adminAuthUserId: string,
  action: string,
  targetMerchantId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await db.from("admin_audit_log").insert({
    admin_auth_user_id: adminAuthUserId,
    action,
    target_merchant_id: targetMerchantId ?? null,
    metadata: metadata ?? null,
  });
}
