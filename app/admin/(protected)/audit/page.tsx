import Link from "next/link";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getAdminAuditLog } from "@/lib/admin";

const ACTION_LABELS: Record<string, string> = {
  sign_in: "Connexion admin",
  view_merchant: "Consultation commerçant",
};

export default async function AdminAuditPage() {
  const db = createServiceRoleClient();
  const entries = await getAdminAuditLog(db);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Journal d&apos;audit</h1>
      <p className="mt-1 text-sm text-gray-600">
        Connexions et consultations de fiches commerçant par l&apos;équipe Fidély (200 dernières entrées).
      </p>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Admin</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Commerçant</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-gray-50 last:border-0">
                <td className="px-4 py-3 text-gray-500">
                  {new Date(entry.createdAt).toLocaleString("fr-FR")}
                </td>
                <td className="px-4 py-3">{entry.adminEmail ?? "?"}</td>
                <td className="px-4 py-3">{ACTION_LABELS[entry.action] ?? entry.action}</td>
                <td className="px-4 py-3">
                  {entry.targetMerchantId ? (
                    <Link
                      href={`/admin/merchants/${entry.targetMerchantId}`}
                      className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      {entry.targetBusinessName ?? entry.targetMerchantId}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  Aucune entrée pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
