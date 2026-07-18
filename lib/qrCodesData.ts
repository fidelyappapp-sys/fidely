import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

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
