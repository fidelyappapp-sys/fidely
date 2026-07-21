import { createServiceRoleClient } from "@/lib/supabase/server";
import { getMerchantsList } from "@/lib/admin";

export default async function AdminMerchantsPage() {
  const db = createServiceRoleClient();
  const merchants = await getMerchantsList(db);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Commerçants</h1>
      <p className="mt-1 text-sm text-gray-600">{merchants.length} commerçant(s).</p>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Commerce</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Inscrit le</th>
              <th className="px-4 py-3 font-medium">Scans ce mois</th>
              <th className="px-4 py-3 font-medium">Facturé (estimé)</th>
            </tr>
          </thead>
          <tbody>
            {merchants.map((m) => (
              <tr key={m.id} className="border-b border-gray-50 last:border-0">
                <td className="px-4 py-3">{m.businessName}</td>
                <td className="px-4 py-3 capitalize">{m.subscriptionStatus}</td>
                <td className="px-4 py-3">{new Date(m.createdAt).toLocaleDateString("fr-FR")}</td>
                <td className="px-4 py-3">{m.scanCount}</td>
                <td className="px-4 py-3">{m.estimatedBillThisMonth.toFixed(2)}€</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
