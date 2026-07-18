import { requireMerchantContext } from "@/lib/merchant";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { urlQrDataUrl } from "@/lib/qr/generate";
import { appBaseUrl } from "@/lib/env";
import { AddEmployeeForm } from "@/components/dashboard/AddEmployeeForm";
import { EmployeeList, type EmployeeItem } from "@/components/dashboard/EmployeeList";

export default async function StaffPage() {
  const merchant = await requireMerchantContext();
  const supabase = await createServerSupabaseClient();

  // The employee-name / active / scan_token columns only exist once
  // migration 0009_team_members.sql has been applied — fall back to the
  // guaranteed-since-0001 columns so the owner's own row (and thus this
  // page) never just disappears in the meantime.
  let staffRows: {
    id: string;
    role: string;
    first_name: string | null;
    last_name: string | null;
    active: boolean;
    scan_token: string | null;
    created_at: string;
  }[] = [];

  const richQuery = await supabase
    .from("merchant_staff")
    .select("id, role, first_name, last_name, active, scan_token, created_at")
    .eq("merchant_id", merchant.merchantId)
    .order("created_at", { ascending: true });

  if (!richQuery.error && richQuery.data) {
    staffRows = richQuery.data;
  } else {
    const fallbackQuery = await supabase
      .from("merchant_staff")
      .select("id, role, created_at")
      .eq("merchant_id", merchant.merchantId)
      .order("created_at", { ascending: true });
    staffRows = (fallbackQuery.data ?? []).map((row) => ({
      ...row,
      first_name: null,
      last_name: null,
      active: true,
      scan_token: null,
    }));
  }

  const employees: EmployeeItem[] = await Promise.all(
    staffRows.map(async (row) => {
      const isOwner = row.role === "owner";
      const name = [row.first_name, row.last_name].filter(Boolean).join(" ") || (isOwner ? merchant.businessName + " (vous)" : "Employé");

      return {
        id: row.id,
        name,
        isOwner,
        active: row.active,
        qrDataUrl:
          !isOwner && row.active && row.scan_token
            ? await urlQrDataUrl(`${appBaseUrl()}/staff-scan/${row.scan_token}`)
            : null,
      };
    })
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold">Équipe</h1>
      <p className="mt-1 text-sm text-gray-600">
        Chaque employé scanne son propre QR code pour ouvrir le scanner sur un appareil de caisse
        partagé — aucun identifiant ni mot de passe à retenir.
      </p>

      {merchant.role === "owner" && (
        <div className="mt-6 max-w-lg">
          <AddEmployeeForm />
        </div>
      )}

      <div className="mt-10">
        <EmployeeList employees={employees} canManage={merchant.role === "owner"} />
      </div>
    </div>
  );
}
