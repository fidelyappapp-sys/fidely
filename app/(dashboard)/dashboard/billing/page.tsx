import { requireMerchantContext } from "@/lib/merchant";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isStripeConfigured } from "@/lib/env";
import { BillingActions } from "@/components/dashboard/BillingActions";

export default async function BillingPage() {
  const merchant = await requireMerchantContext();
  const supabase = await createServerSupabaseClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: scansThisMonth } = await supabase
    .from("scan_events")
    .select("id", { count: "exact", head: true })
    .eq("merchant_id", merchant.merchantId)
    .gte("created_at", startOfMonth.toISOString());

  const scans = scansThisMonth ?? 0;
  const estimatedBill = Math.max(30, scans * 0.1);
  const hasActiveSubscription = merchant.subscriptionStatus === "active";

  return (
    <div>
      <h1 className="text-2xl font-semibold">Facturation</h1>
      <p className="mt-1 text-sm text-gray-600">
        0,10€ par scan, minimum 30€ / mois. Une seule offre, tout inclus.
      </p>

      {!isStripeConfigured && (
        <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          La facturation Stripe n&apos;est pas encore configurée côté serveur.
        </p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 p-6">
          <p className="text-sm text-gray-500">Statut</p>
          <p className="mt-2 text-lg font-semibold capitalize">{merchant.subscriptionStatus}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 p-6">
          <p className="text-sm text-gray-500">Scans ce mois-ci</p>
          <p className="mt-2 text-lg font-semibold">{scans}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 p-6">
          <p className="text-sm text-gray-500">Facture estimée</p>
          <p className="mt-2 text-lg font-semibold">{estimatedBill.toFixed(2)}€</p>
        </div>
      </div>

      {isStripeConfigured && (
        <div className="mt-8">
          <BillingActions hasActiveSubscription={hasActiveSubscription} />
        </div>
      )}
    </div>
  );
}
