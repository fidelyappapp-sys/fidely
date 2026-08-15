import { requireMerchantContext } from "@/lib/merchant";
import { isStripeConfigured } from "@/lib/env";
import { NfcCardOrderForm } from "@/components/dashboard/NfcCardOrderForm";
import { AddMerchantForm } from "@/components/dashboard/AddMerchantForm";

export default async function BoutiquePage() {
  const merchant = await requireMerchantContext();

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
            <NfcCardOrderForm productKey="nfc_card" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900">Carte de fidélité NFC</h2>
            <p className="mt-1 mb-4 max-w-2xl text-sm text-gray-600">
              Carte NFC à remettre à vos clients pour ajouter leur carte de fidélité au Wallet en un
              geste, sans QR code à scanner. Tarif dégressif selon la quantité commandée.
            </p>
            <NfcCardOrderForm productKey="nfc_loyalty_card" />
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
