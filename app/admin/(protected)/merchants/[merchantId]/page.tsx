import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminContext } from "@/lib/adminAuth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/adminAudit";
import { getMerchantPageExtras } from "@/lib/merchantPageContent";
import { getMerchantQrCodes } from "@/lib/qrCodesData";
import { getShopOrdersForMerchant } from "@/lib/admin";
import { listInvoices } from "@/lib/invoicing";
import { urlQrDataUrl } from "@/lib/qr/generate";
import { appBaseUrl } from "@/lib/env";

const STATUS_LABELS: Record<string, string> = {
  active: "Actif",
  paused: "En pause",
  past_due: "Impayé",
  canceled: "Résilié",
  incomplete: "Facturation à finaliser",
};

export default async function AdminMerchantDetailPage({
  params,
}: {
  params: Promise<{ merchantId: string }>;
}) {
  const admin = await requireAdminContext();
  const { merchantId } = await params;
  const db = createServiceRoleClient();

  const { data: merchant } = await db
    .from("merchants")
    .select("id, business_name, slug, subscription_status, created_at, auth_user_id, stripe_customer_id")
    .eq("id", merchantId)
    .maybeSingle();

  if (!merchant) notFound();

  await logAdminAction(db, admin.authUserId, "view_merchant", merchant.id);

  const [extras, customQrRows, { data: userResult }, orders, invoices] = await Promise.all([
    getMerchantPageExtras(db, merchant.id),
    getMerchantQrCodes(db, merchant.id),
    db.auth.admin.getUserById(merchant.auth_user_id),
    getShopOrdersForMerchant(db, merchant.id),
    listInvoices(db, { merchantId: merchant.id }),
  ]);

  const joinUrl = `${appBaseUrl()}/join/${merchant.slug}`;
  const [joinQrDataUrl, customQrCodes] = await Promise.all([
    urlQrDataUrl(joinUrl),
    Promise.all(customQrRows.map(async (row) => ({ ...row, qrDataUrl: await urlQrDataUrl(row.targetUrl) }))),
  ]);

  return (
    <div className="space-y-12">
      <div>
        <Link href="/admin/merchants" className="text-sm text-gray-500 hover:text-gray-900">
          ← Commerçants
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{merchant.business_name}</h1>
          <Link
            href={`/admin/merchants/${merchant.id}/qr-print`}
            className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Imprimer les QR codes
          </Link>
        </div>
      </div>

      <section>
        <h2 className="font-semibold text-gray-900">Informations</h2>
        <dl className="mt-3 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-gray-500">Statut</dt>
            <dd className="mt-0.5 font-medium">
              {STATUS_LABELS[merchant.subscription_status] ?? merchant.subscription_status}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Inscrit le</dt>
            <dd className="mt-0.5 font-medium">
              {new Date(merchant.created_at).toLocaleDateString("fr-FR")}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Email</dt>
            <dd className="mt-0.5 font-medium">{userResult.user?.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Téléphone</dt>
            <dd className="mt-0.5 font-medium">{extras.phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Adresse</dt>
            <dd className="mt-0.5 font-medium">{extras.address ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Client Stripe</dt>
            <dd className="mt-0.5 font-medium">
              {merchant.stripe_customer_id ? (
                <a
                  href={`https://dashboard.stripe.com/customers/${merchant.stripe_customer_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-500"
                >
                  {merchant.stripe_customer_id}
                </a>
              ) : (
                "—"
              )}
            </dd>
          </div>
        </dl>
      </section>

      <section>
        <h2 className="font-semibold text-gray-900">QR codes</h2>
        <div className="mt-3 flex flex-wrap gap-6">
          <div className="text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={joinQrDataUrl} alt="QR d'inscription" width={140} height={140} />
            <p className="mt-1 text-xs text-gray-500">Inscription</p>
            <a
              href={joinQrDataUrl}
              download={`fidely-qr-${merchant.slug}-inscription.png`}
              className="mt-1 block text-xs font-medium text-indigo-600 hover:text-indigo-500"
            >
              Télécharger
            </a>
          </div>
          {customQrCodes.map((qr) => (
            <div key={qr.id} className="text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr.qrDataUrl} alt={qr.label} width={140} height={140} />
              <p className="mt-1 text-xs text-gray-500">{qr.label}</p>
              <a
                href={qr.qrDataUrl}
                download={`fidely-qr-${merchant.slug}-${qr.label}.png`}
                className="mt-1 block text-xs font-medium text-indigo-600 hover:text-indigo-500"
              >
                Télécharger
              </a>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Version imprimable (carte ou A4) : bouton en haut de page.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-gray-900">Commandes</h2>
        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">Aucune commande.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-2xl border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">Montant</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 capitalize">{order.status}</td>
                    <td className="px-4 py-3">{(order.amountCents / 100).toFixed(2)}€</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-semibold text-gray-900">Facturation</h2>
        {invoices.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">Aucune facture émise pour le moment.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-2xl border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Date</th>
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
                    <td className="px-4 py-3 capitalize">{invoice.status}</td>
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
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
