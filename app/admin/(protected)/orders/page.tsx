import { createServiceRoleClient } from "@/lib/supabase/server";
import { getShopOrders } from "@/lib/admin";
import type { KitShippingAddress } from "@/lib/supabase/types";

const STATUS_LABELS: Record<string, string> = {
  paid: "Payée",
  shipped: "Expédiée",
  delivered: "Livrée",
};

export default async function AdminOrdersPage() {
  const db = createServiceRoleClient();
  const orders = await getShopOrders(db);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Commandes boutique</h1>
      <p className="mt-1 text-sm text-gray-600">{orders.length} commande(s).</p>

      <div className="mt-6 space-y-4">
        {orders.map((order) => {
          const address = order.shippingAddress as KitShippingAddress | null;
          return (
            <div key={order.id} className="rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <p className="font-medium">{order.businessName}</p>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>

              <ul className="mt-3 space-y-1 text-sm text-gray-700">
                {order.items.map((item, i) => (
                  <li key={i}>
                    {item.quantity} × {item.label}
                  </li>
                ))}
              </ul>

              <p className="mt-2 text-sm font-medium text-gray-900">
                Total : {(order.amountCents / 100).toFixed(2)}€
              </p>

              <p className="mt-2 text-sm text-gray-600">
                Livraison :{" "}
                {order.deliveryMethod === "postal_shipping"
                  ? "La Poste"
                  : order.deliveryMethod === "hand_delivery"
                    ? "Main propre"
                    : "Non précisée"}
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
        {orders.length === 0 && <p className="text-sm text-gray-500">Aucune commande pour le moment.</p>}
      </div>
    </div>
  );
}
