import { createServiceRoleClient } from "@/lib/supabase/server";
import { getPendingKitOrders } from "@/lib/admin";
import type { KitShippingAddress } from "@/lib/supabase/types";

export default async function AdminKitsPage() {
  const db = createServiceRoleClient();
  const orders = await getPendingKitOrders(db);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Kits en attente</h1>
      <p className="mt-1 text-sm text-gray-600">{orders.length} commande(s) en attente.</p>

      <div className="mt-6 space-y-4">
        {orders.map((order) => {
          const address = order.shippingAddress as KitShippingAddress | null;
          return (
            <div key={order.id} className="rounded-2xl border border-gray-100 p-6">
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
            </div>
          );
        })}
        {orders.length === 0 && <p className="text-sm text-gray-500">Aucune commande en attente.</p>}
      </div>
    </div>
  );
}
