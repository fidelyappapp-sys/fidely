import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export interface CustomQrCodeRow {
  id: string;
  label: string;
  targetUrl: string;
  kind: "custom" | "join_source" | "main";
  city: string | null;
}

// merchant_qr_codes only exists once migration 0006_qr_codes.sql has been
// applied — empty list rather than a crash until then.
export async function getMerchantQrCodes(
  supabase: SupabaseClient<Database>,
  merchantId: string
): Promise<CustomQrCodeRow[]> {
  const { data, error } = await supabase
    .from("merchant_qr_codes")
    .select("id, label, target_url, kind, city")
    .eq("merchant_id", merchantId)
    .order("position", { ascending: true });

  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    label: row.label,
    targetUrl: row.target_url,
    kind: row.kind as "custom" | "join_source" | "main",
    city: row.city,
  }));
}
