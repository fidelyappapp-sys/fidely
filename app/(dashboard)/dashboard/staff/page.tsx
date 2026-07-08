import { requireMerchantContext } from "@/lib/merchant";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { InviteStaffForm } from "@/components/dashboard/InviteStaffForm";
import { removeStaffMemberFormAction } from "@/lib/actions/staff";

export default async function StaffPage() {
  const merchant = await requireMerchantContext();
  const supabase = await createServerSupabaseClient();

  const { data: staffRows } = await supabase
    .from("merchant_staff")
    .select("id, role, auth_user_id, created_at")
    .eq("merchant_id", merchant.merchantId)
    .order("created_at", { ascending: true });

  const db = createServiceRoleClient();
  const staffWithEmails = await Promise.all(
    (staffRows ?? []).map(async (row) => {
      const { data } = await db.auth.admin.getUserById(row.auth_user_id);
      return { ...row, email: data.user?.email ?? "—" };
    })
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold">Équipe</h1>
      <p className="mt-1 text-sm text-gray-600">
        Les membres invités peuvent utiliser le scanner et consulter le tableau de bord.
      </p>

      {merchant.role === "owner" && (
        <div className="mt-6 max-w-md">
          <InviteStaffForm />
        </div>
      )}

      <div className="mt-8 overflow-hidden rounded-2xl border border-gray-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Rôle</th>
              <th className="px-4 py-3 font-medium">Depuis</th>
              {merchant.role === "owner" && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {staffWithEmails.map((staff) => (
              <tr key={staff.id}>
                <td className="px-4 py-3">{staff.email}</td>
                <td className="px-4 py-3 capitalize">{staff.role}</td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(staff.created_at).toLocaleDateString("fr-FR")}
                </td>
                {merchant.role === "owner" && (
                  <td className="px-4 py-3 text-right">
                    {staff.role === "staff" && (
                      <form action={removeStaffMemberFormAction.bind(null, staff.id)}>
                        <button type="submit" className="text-xs text-red-600 hover:underline">
                          Retirer
                        </button>
                      </form>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
