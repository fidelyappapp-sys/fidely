import { requireMerchantContext } from "@/lib/merchant";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Scanner } from "@/components/dashboard/Scanner";

export default async function ScanPage() {
  const merchant = await requireMerchantContext();
  const supabase = await createServerSupabaseClient();
  const { data: program } = await supabase
    .from("loyalty_programs")
    .select("display_mode")
    .eq("merchant_id", merchant.merchantId)
    .single();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Scanner</h1>
      <p className="mt-1 text-sm text-gray-600">
        Scannez le QR code du client pour lui attribuer des points.
      </p>
      <div className="mt-6">
        <Scanner displayMode={program?.display_mode ?? "stamps"} />
      </div>
    </div>
  );
}
