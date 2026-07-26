import { notFound } from "next/navigation";
import Link from "next/link";
import { requireMerchantContext } from "@/lib/merchant";
import { createServiceRoleClient } from "@/lib/supabase/server";

export default async function CustomerCardPage({
  params,
}: {
  params: Promise<{ cardId: string }>;
}) {
  const { cardId } = await params;
  const merchant = await requireMerchantContext();
  // customers has no RLS policies by design (server-side only) — see
  // dashboard/customers/page.tsx for the same fix and rationale.
  const supabase = createServiceRoleClient();

  const { data: card } = await supabase
    .from("loyalty_cards")
    .select("id, points, public_id, created_at, customers(full_name, email, phone)")
    .eq("id", cardId)
    .eq("merchant_id", merchant.merchantId)
    .maybeSingle();

  if (!card) notFound();

  const customer = card.customers as unknown as {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;

  const { data: scans } = await supabase
    .from("scan_events")
    .select("id, points_awarded, points_balance_after, created_at")
    .eq("loyalty_card_id", card.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <Link href="/dashboard/customers" className="text-sm text-gray-500 hover:text-gray-900">
        ← Clients
      </Link>

      <h1 className="mt-2 text-2xl font-semibold">{customer?.full_name || "Client sans nom"}</h1>
      <p className="mt-1 text-sm text-gray-600">{customer?.email || customer?.phone || "—"}</p>

      <div className="mt-6 flex gap-4">
        <div className="rounded-2xl border border-gray-100 p-6">
          <p className="text-sm text-gray-500">Points actuels</p>
          <p className="mt-2 text-3xl font-semibold">{card.points}</p>
        </div>
        <Link
          href={`/c/${card.public_id}`}
          target="_blank"
          className="flex items-center rounded-2xl border border-gray-100 px-6 text-sm font-medium text-gray-900 hover:bg-gray-50"
        >
          Voir la carte client →
        </Link>
      </div>

      <h2 className="mt-10 text-lg font-semibold">Historique des scans</h2>
      <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Points attribués</th>
              <th className="px-4 py-3 font-medium">Solde après</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(scans ?? []).map((scan) => (
              <tr key={scan.id}>
                <td className="px-4 py-3 text-gray-600">
                  {new Date(scan.created_at).toLocaleString("fr-FR")}
                </td>
                <td className="px-4 py-3">+{scan.points_awarded}</td>
                <td className="px-4 py-3">{scan.points_balance_after}</td>
              </tr>
            ))}
            {(!scans || scans.length === 0) && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                  Aucun scan enregistré.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
