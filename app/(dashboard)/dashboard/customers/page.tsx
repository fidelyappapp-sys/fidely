import Link from "next/link";
import { requireMerchantContext } from "@/lib/merchant";
import { createServiceRoleClient } from "@/lib/supabase/server";

export default async function CustomersPage() {
  const merchant = await requireMerchantContext();
  // customers has no RLS policies by design (server-side only) — the RLS
  // client's embedded `customers(...)` join silently returns null, so this
  // page needs the service-role client. merchant_id scoping below (already
  // authorized via requireMerchantContext) keeps this tenant-scoped.
  const supabase = createServiceRoleClient();

  const { data: cards } = await supabase
    .from("loyalty_cards")
    .select("id, points, created_at, customers(full_name, email, phone)")
    .eq("merchant_id", merchant.merchantId)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clients</h1>
        <Link
          href={`/join/${merchant.slug}`}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          Page d&apos;inscription →
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Points</th>
              <th className="px-4 py-3 font-medium">Inscrit le</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(cards ?? []).map((card) => {
              const customer = card.customers as unknown as {
                full_name: string | null;
                email: string | null;
                phone: string | null;
              } | null;
              return (
                <tr key={card.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/customers/${card.id}`}
                      className="font-medium text-gray-900 hover:underline"
                    >
                      {customer?.full_name || "Client sans nom"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {customer?.email || customer?.phone || "—"}
                  </td>
                  <td className="px-4 py-3">{card.points}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(card.created_at).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              );
            })}
            {(!cards || cards.length === 0) && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  Aucun client pour le moment. Partagez votre lien d&apos;inscription.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
