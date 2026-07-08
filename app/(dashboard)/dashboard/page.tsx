import Link from "next/link";
import { requireMerchantContext } from "@/lib/merchant";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function DashboardOverviewPage() {
  const merchant = await requireMerchantContext();
  const supabase = await createServerSupabaseClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [{ count: cardsCount }, { count: scansThisMonth }] = await Promise.all([
    supabase
      .from("loyalty_cards")
      .select("id", { count: "exact", head: true })
      .eq("merchant_id", merchant.merchantId),
    supabase
      .from("scan_events")
      .select("id", { count: "exact", head: true })
      .eq("merchant_id", merchant.merchantId)
      .gte("created_at", startOfMonth.toISOString()),
  ]);

  const estimatedBill = Math.max(30, (scansThisMonth ?? 0) * 0.1);

  const stats = [
    { label: "Cartes clients", value: cardsCount ?? 0 },
    { label: "Scans ce mois-ci", value: scansThisMonth ?? 0 },
    { label: "Facture estimée", value: `${estimatedBill.toFixed(2)}€` },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold">Vue d&apos;ensemble</h1>
      <p className="mt-1 text-sm text-gray-600">Bonjour, {merchant.businessName}.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-gray-100 p-6">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/dashboard/scan"
          className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700"
        >
          Ouvrir le scanner
        </Link>
        <Link
          href={`/join/${merchant.slug}`}
          className="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-medium hover:bg-gray-50"
        >
          Voir la page d&apos;inscription client
        </Link>
      </div>
    </div>
  );
}
