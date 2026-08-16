import Link from "next/link";
import { requireMerchantContext } from "@/lib/merchant";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { PosSelector } from "@/components/dashboard/PosSelector";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ pos?: string }>;
}) {
  const merchant = await requireMerchantContext();
  const { pos } = await searchParams;
  // customers has no RLS policies by design (server-side only) — the RLS
  // client's embedded `customers(...)` join silently returns null, so this
  // page needs the service-role client. merchant_id scoping below (already
  // authorized via requireMerchantContext) keeps this tenant-scoped.
  const supabase = createServiceRoleClient();

  const { data: pointsOfSale } = await supabase
    .from("merchant_qr_codes")
    .select("id, label, city")
    .eq("merchant_id", merchant.merchantId)
    .in("kind", ["main", "join_source"])
    .order("created_at", { ascending: true });

  let cardsQuery = supabase
    .from("loyalty_cards")
    .select("id, points, created_at, customers(full_name, email, phone), merchant_qr_codes(label)")
    .eq("merchant_id", merchant.merchantId)
    .order("created_at", { ascending: false });

  if (pos && pos !== "all") {
    cardsQuery = cardsQuery.eq("merchant_qr_code_id", pos);
  }

  const { data: cards } = await cardsQuery;

  const topCustomers = [...(cards ?? [])]
    .filter((card) => card.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);

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

      {pointsOfSale && pointsOfSale.length > 1 && (
        <div className="mt-4">
          <PosSelector
            items={pointsOfSale.map((row) => ({ id: row.id, label: row.label, city: row.city }))}
            selectedId={pos ?? "all"}
            basePath="/dashboard/customers"
            allowAll
          />
        </div>
      )}

      {topCustomers.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold tracking-wide text-gray-500 uppercase">
            Meilleurs clients
          </h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {topCustomers.map((card, i) => {
              const customer = card.customers as unknown as { full_name: string | null } | null;
              return (
                <Link
                  key={card.id}
                  href={`/dashboard/customers/${card.id}`}
                  className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 hover:bg-gray-50"
                >
                  <span className="flex items-center gap-2 truncate text-sm font-medium text-gray-900">
                    <span className="text-gray-400">#{i + 1}</span>
                    <span className="truncate">{customer?.full_name || "Client sans nom"}</span>
                  </span>
                  <span className="shrink-0 text-sm text-gray-500">{card.points} pts</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Point de vente</th>
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
              const pointOfSale = card.merchant_qr_codes as unknown as { label: string } | null;
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
                  <td className="px-4 py-3 text-gray-500">{pointOfSale?.label ?? "—"}</td>
                  <td className="px-4 py-3">{card.points}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(card.created_at).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              );
            })}
            {(!cards || cards.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
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
