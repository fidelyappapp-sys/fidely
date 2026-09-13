import Link from "next/link";
import { createServiceRoleClient } from "@/lib/supabase/server";

const TIER_LABELS: Record<string, string> = {
  avis: "Plaque (30€)",
  presence: "Carte (40€)",
  pro: "Carte + abonnement (50€)",
};

// The 100-code /j/ batch (see supabase/migrations/0034_j_code_import.sql) —
// standalone plaques (merchant_id null) assigned one at a time here, as
// opposed to the self-service checkout flow under /admin/merchants.
export default async function AdminPlaquesPage() {
  const db = createServiceRoleClient();
  const { data: plaques } = await db
    .from("plaques")
    .select("short_code, tier, merchant_name")
    .is("merchant_id", null)
    .order("short_code");

  const rows = plaques ?? [];
  const activatedCount = rows.filter((r) => r.tier).length;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Cartes /j</h1>
      <p className="mt-1 text-sm text-gray-600">
        {activatedCount} / {rows.length} activée(s).
      </p>

      <div className="mt-6 divide-y divide-gray-100 rounded-2xl border border-gray-100">
        {rows.map((row) => (
          <Link
            key={row.short_code}
            href={`/admin/plaques/${row.short_code}`}
            className="flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50"
          >
            <span className="font-mono">{row.short_code}</span>
            <span className="text-gray-600">{row.merchant_name ?? "—"}</span>
            <span className={row.tier ? "text-gray-900" : "text-gray-400"}>
              {row.tier ? TIER_LABELS[row.tier] : "Non activée"}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
