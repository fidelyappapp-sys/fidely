import Link from "next/link";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getPendingKitOrders } from "@/lib/admin";
import { urlQrDataUrl } from "@/lib/qr/generate";
import { appBaseUrl } from "@/lib/env";
import type { KitShippingAddress } from "@/lib/supabase/types";

export default async function AdminKitsPage() {
  const db = createServiceRoleClient();
  const orders = await getPendingKitOrders(db);

  const orderQrCodes = await Promise.all(
    orders.map((order) => urlQrDataUrl(`${appBaseUrl()}/join/${order.slug}`))
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold">Kits en attente</h1>
      <p className="mt-1 text-sm text-gray-600">{orders.length} commande(s) en attente.</p>

      <div className="mt-6 space-y-4">
        {orders.map((order, i) => {
          const address = order.shippingAddress as KitShippingAddress | null;
          const qrDataUrl = orderQrCodes[i];
          return (
            <div key={order.id} className="flex gap-6 rounded-2xl border border-gray-100 p-6">
              <div className="shrink-0 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt={`QR d'inscription — ${order.businessName}`} width={96} height={96} />
                <a
                  href={qrDataUrl}
                  download={`fidely-qr-${order.slug}.png`}
                  className="mt-1 block text-xs font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Télécharger
                </a>
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{order.businessName}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Livraison :{" "}
                  {order.deliveryMethod === "postal_shipping"
                    ? "La Poste"
                    : order.deliveryMethod === "hand_delivery"
                      ? "Main propre"
                      : "Non choisie"}
                </p>
                {address && (
                  <p className="mt-1 text-sm text-gray-600">
                    {address.name} — {address.line1} {address.line2} {address.postalCode} {address.city}{" "}
                    {address.country}
                  </p>
                )}
                <Link
                  href={`/admin/merchants/${order.id}`}
                  className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Voir la fiche complète (infos, tous les QR, impression) →
                </Link>
              </div>
            </div>
          );
        })}
        {orders.length === 0 && <p className="text-sm text-gray-500">Aucune commande en attente.</p>}
      </div>
    </div>
  );
}
