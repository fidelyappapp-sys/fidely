import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, MerchantStaffRole } from "@/lib/supabase/types";

export interface StaffScanRow {
  id: string;
  role: MerchantStaffRole;
  authUserId: string;
  scanToken: string | null;
}

// scan_token only exists once migration 0005_qr_codes.sql has been applied.
// Falls back to a plain staff list (no personal QR yet) rather than losing
// the whole page if it hasn't.
export async function getStaffScanRows(
  supabase: SupabaseClient<Database>,
  merchantId: string
): Promise<StaffScanRow[]> {
  const { data, error } = await supabase
    .from("merchant_staff")
    .select("id, role, auth_user_id, scan_token")
    .eq("merchant_id", merchantId)
    .order("created_at", { ascending: true });

  if (!error && data) {
    return data.map((row) => ({
      id: row.id,
      role: row.role,
      authUserId: row.auth_user_id,
      scanToken: row.scan_token,
    }));
  }

  const fallback = await supabase
    .from("merchant_staff")
    .select("id, role, auth_user_id")
    .eq("merchant_id", merchantId)
    .order("created_at", { ascending: true });

  return (fallback.data ?? []).map((row) => ({
    id: row.id,
    role: row.role,
    authUserId: row.auth_user_id,
    scanToken: null,
  }));
}

export interface CustomQrCodeRow {
  id: string;
  label: string;
  targetUrl: string;
}

// merchant_qr_codes only exists once migration 0005_qr_codes.sql has been
// applied — empty list rather than a crash until then.
export async function getMerchantQrCodes(
  supabase: SupabaseClient<Database>,
  merchantId: string
): Promise<CustomQrCodeRow[]> {
  const { data, error } = await supabase
    .from("merchant_qr_codes")
    .select("id, label, target_url")
    .eq("merchant_id", merchantId)
    .order("position", { ascending: true });

  if (error || !data) return [];
  return data.map((row) => ({ id: row.id, label: row.label, targetUrl: row.target_url }));
}
