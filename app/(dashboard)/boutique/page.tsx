import { requireMerchantContext } from "@/lib/merchant";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isStripeConfigured } from "@/lib/env";
import { getMerchantOwnedPlaqueCount } from "@/lib/boutique.server";
import { NfcCardOrderForm } from "@/components/dashboard/NfcCardOrderForm";
import { PlaqueComponentsOrderForm } from "@/components/dashboard/PlaqueComponentsOrderForm";
import { AddMerchantForm } from "@/components/dashboard/AddMerchantForm";

export default async function BoutiquePage() {
  const merchant = await requireMerchantContext();

  // Same point-of-sale query as the Clients/Programme pages — needed here
  // so a QR code or NFC chip order can be tied to a specific point of sale
  // (see PlaqueComponentsOrderForm).
  const supabase = await createServerSupabaseClient();
  const [{ data: pointsOfSale }, alreadyOwned, { data: plaqueSubscription }] = await Promise.all([
    supabase
      .from("merchant_qr_codes")
      .select("id, label, city")
      .eq("merchant_id", merchant.merchantId)
      .in("kind", ["main", "join_source"])
      .order("created_at", { ascending: true }),
    getMerchantOwnedPlaqueCount(merchant.merchantId),
    supabase
      .from("merchant_plaque_subscriptions")
      .select("status")
      .eq("merchant_id", merchant.merchantId)
      .maybeSingle(),
  ]);
  const hasActivePlaqueSubscription = plaqueSubscription?.status === "active";

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-2xl font-semibold">Boutique</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Votre premier kit vous a été offert. En cas de perte, vol ou casse, commandez un kit de
          remplacement ci-dessous. Vous pouvez également commander des kits supplémentaires pour vos
          autres commerces.
        </p>
      </div>

      {!isStripeConfigured ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          La facturation Stripe n&apos;est pas encore configurée côté serveur.
        </p>
      ) : (
        <>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Plaque avis Google</h2>
            <p className="mt-1 mb-4 max-w-2xl text-sm text-gray-600">
              Plaque NFC + QR code à poser en caisse pour récolter plus d&apos;avis Google 5 étoiles.
              Tarif dégressif selon la quantité commandée.
            </p>
            <NfcCardOrderForm alreadyOwned={alreadyOwned} hasActivePlaqueSubscription={hasActivePlaqueSubscription} />

            <div className="mt-8 border-t border-gray-100 pt-8">
              <PlaqueComponentsOrderForm pointsOfSale={pointsOfSale ?? []} />
            </div>
          </div>
        </>
      )}

      {merchant.role === "owner" && isStripeConfigured && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Ajouter un commerce</h2>
          <p className="mt-1 mb-4 max-w-2xl text-sm text-gray-600">
            Gérez plusieurs enseignes depuis un seul compte. Chaque commerce a sa propre facturation,
            mais tout se gère ici.
          </p>
          <AddMerchantForm />
        </div>
      )}
    </div>
  );
}
