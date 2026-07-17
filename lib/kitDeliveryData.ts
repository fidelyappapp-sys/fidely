import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, KitDeliveryMethod, KitDeliveryStatus, KitShippingAddress } from "@/lib/supabase/types";

export interface KitDeliveryInfo {
  method: KitDeliveryMethod | null;
  status: KitDeliveryStatus;
  address: KitShippingAddress | null;
}

const NOT_CHOSEN_YET: KitDeliveryInfo = { method: null, status: "pending", address: null };

// kit_delivery_* columns only exist once migration 0007_kit_delivery.sql
// has been applied — "not chosen yet" rather than a crash until then.
export async function getKitDeliveryInfo(
  supabase: SupabaseClient<Database>,
  merchantId: string
): Promise<KitDeliveryInfo> {
  const { data, error } = await supabase
    .from("merchants")
    .select("kit_delivery_method, kit_delivery_status, kit_shipping_address")
    .eq("id", merchantId)
    .maybeSingle();

  if (error || !data) return NOT_CHOSEN_YET;

  return {
    method: data.kit_delivery_method,
    status: data.kit_delivery_status,
    address: data.kit_shipping_address,
  };
}
