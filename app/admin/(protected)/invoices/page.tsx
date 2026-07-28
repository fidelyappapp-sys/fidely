import Link from "next/link";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { listInvoices } from "@/lib/invoicing";

const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  open: "En attente",
  paid: "Payée",
  uncollectible: "Irrécouvrable",
  void: "Annulée",
};

export default async function AdminInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; month?: string }>;
}) {
  const { status, month } = await searchParams;
  const db = createServiceRoleClient();
  const invoices = await listInvoices(db, { status, month });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Factures</h1>
      <p className="mt-1 text-sm text-gray-600">
        Générées automatiquement par Stripe à chaque cycle de facturation. Chaque facture est le
        document légal hébergé par Stripe (numérotation, TVA) — cette page n&apos;en est qu&apos;un
        index de recherche.
      </p>

      <form className="mt-6 flex flex-wrap items-end gap-3 text-sm">
        <div>
          <label htmlFor="month" className="block text-gray-500">Mois</label>
          <input
            id="month"
            name="month"
            type="month"
            defaultValue={month}
            className="mt-1 rounded-lg border border-gray-300 px-3 py-1.5"
          />
        </div>
        <div>
          <label htmlFor="status" className="block text-gray-500">Statut</label>
          <select
            id="status"
            name="status"
            defaultValue={status ?? ""}
            className="mt-1 rounded-lg border border-gray-300 px-3 py-1.5"
          >
            <option value="">Tous</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-full bg-gray-900 px-4 py-1.5 font-medium text-white hover:bg-gray-700"
        >
          Filtrer
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Commerçant</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Montant</th>
              <th className="px-4 py-3 font-medium">Facture</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-b border-gray-50 last:border-0">
                <td className="px-4 py-3 text-gray-500">
                  {new Date(invoice.createdAt).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/merchants/${invoice.merchantId}`}
                    className="font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    {invoice.businessName}
                  </Link>
                </td>
                <td className="px-4 py-3">{STATUS_LABELS[invoice.status] ?? invoice.status}</td>
                <td className="px-4 py-3">{(invoice.amountCents / 100).toFixed(2)}€</td>
                <td className="px-4 py-3">
                  {invoice.hostedInvoiceUrl ? (
                    <a
                      href={invoice.hostedInvoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      Voir sur Stripe
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  Aucune facture pour ces filtres.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
