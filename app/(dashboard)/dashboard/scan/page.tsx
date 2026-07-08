import { requireMerchantContext } from "@/lib/merchant";
import { Scanner } from "@/components/dashboard/Scanner";

export default async function ScanPage() {
  await requireMerchantContext();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Scanner</h1>
      <p className="mt-1 text-sm text-gray-600">
        Scannez le QR code du client pour lui attribuer des points.
      </p>
      <div className="mt-6">
        <Scanner />
      </div>
    </div>
  );
}
