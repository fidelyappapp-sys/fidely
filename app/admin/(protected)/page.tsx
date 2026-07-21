import { createServiceRoleClient } from "@/lib/supabase/server";
import {
  getSubscriptionCounts,
  getRevenueForRange,
  getSubscriberTrend,
  getAdminAlerts,
} from "@/lib/admin";
import { SubscriptionsChart } from "@/components/admin/SubscriptionsChart";
import { BroadcastForm } from "@/components/admin/BroadcastForm";

export default async function AdminOverviewPage() {
  const db = createServiceRoleClient();

  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [counts, revenueThisMonth, revenueLastMonth, trend, alerts] = await Promise.all([
    getSubscriptionCounts(db),
    getRevenueForRange(startOfThisMonth, now),
    getRevenueForRange(startOfLastMonth, startOfThisMonth),
    getSubscriberTrend(db),
    getAdminAlerts(db),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold">Vue d&apos;ensemble</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 p-6">
          <p className="text-sm text-gray-500">Abonnés actifs</p>
          <p className="mt-2 text-2xl font-semibold">{counts.active}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 p-6">
          <p className="text-sm text-gray-500">En pause</p>
          <p className="mt-2 text-2xl font-semibold">{counts.paused}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 p-6">
          <p className="text-sm text-gray-500">Résiliés</p>
          <p className="mt-2 text-2xl font-semibold">{counts.canceled}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 p-6">
          <p className="text-sm text-gray-500">Revenus ce mois-ci</p>
          <p className="mt-2 text-2xl font-semibold">
            {revenueThisMonth === null ? "Stripe non configuré" : `${revenueThisMonth.toFixed(2)}€`}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 p-6">
          <p className="text-sm text-gray-500">Revenus mois précédent</p>
          <p className="mt-2 text-2xl font-semibold">
            {revenueLastMonth === null ? "Stripe non configuré" : `${revenueLastMonth.toFixed(2)}€`}
          </p>
        </div>
      </div>

      {(alerts.pastDue.length > 0 || alerts.pauseEndingSoon.length > 0) && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <p className="text-sm font-semibold text-amber-800">Alertes</p>
          <ul className="mt-2 space-y-1 text-sm text-amber-800">
            {alerts.pastDue.map((m) => (
              <li key={m.id}>Paiement en échec — {m.businessName}</li>
            ))}
            {alerts.pauseEndingSoon.map((m) => (
              <li key={m.id}>
                Fin de pause proche ({new Date(m.pauseEndsAt).toLocaleDateString("fr-FR")}) — {m.businessName}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="mb-4 text-sm font-semibold text-gray-700">Évolution des abonnements (12 mois)</p>
        <div className="rounded-2xl border border-gray-100 p-6">
          <SubscriptionsChart points={trend} />
        </div>
      </div>

      <div>
        <p className="mb-4 text-sm font-semibold text-gray-700">Message à tous les commerçants</p>
        <div className="rounded-2xl border border-gray-100 p-6">
          <BroadcastForm />
        </div>
      </div>
    </div>
  );
}
