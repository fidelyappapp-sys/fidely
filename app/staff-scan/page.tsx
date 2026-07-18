import { cookies } from "next/headers";
import Link from "next/link";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { STAFF_SCAN_COOKIE, verifyStaffScanSession } from "@/lib/staffScanAuth";
import { Scanner } from "@/components/dashboard/Scanner";

export default async function StaffScanPage({
  searchParams,
}: {
  searchParams: Promise<{ invalid?: string }>;
}) {
  const { invalid } = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get(STAFF_SCAN_COOKIE)?.value;
  const session = token ? await verifyStaffScanSession(token) : null;

  if (!session) {
    return (
      <div className="mx-auto flex min-h-full max-w-sm flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Scanner Fidély</h1>
        <p className="mt-3 text-sm text-gray-600">
          {invalid
            ? "Ce lien n'est plus valide. Demandez un nouveau QR code à votre responsable."
            : "Scannez votre QR code personnel (fourni par votre responsable) pour ouvrir le scanner sur cet appareil."}
        </p>
      </div>
    );
  }

  const db = createServiceRoleClient();
  const [{ data: merchantRow }, { data: staffRow }] = await Promise.all([
    db.from("merchants").select("business_name").eq("id", session.merchantId).maybeSingle(),
    db.from("merchant_staff").select("first_name, last_name").eq("id", session.staffId).maybeSingle(),
  ]);

  const employeeName = [staffRow?.first_name, staffRow?.last_name].filter(Boolean).join(" ");

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Scanner</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {employeeName || "Employé"} · {merchantRow?.business_name ?? "Commerce"}
          </p>
        </div>
        <Link href="/staff-scan/logout" className="text-xs font-medium text-gray-500 underline">
          Changer d&apos;employé
        </Link>
      </div>

      <div className="mt-6">
        <Scanner />
      </div>
    </div>
  );
}
