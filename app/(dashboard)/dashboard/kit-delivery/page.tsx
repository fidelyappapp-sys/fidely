import { requireMerchantContext } from "@/lib/merchant";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getKitDeliveryInfo } from "@/lib/kitDeliveryData";
import { KitDeliveryForm } from "@/components/dashboard/KitDeliveryForm";

const METHOD_LABELS: Record<string, string> = {
  hand_delivery: "Livraison en main propre",
  express_shipping: "Envoi postal express (3,99€)",
  standard_shipping: "Envoi postal standard",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  processing: "En préparation",
  shipped: "Expédié",
  delivered: "Livré",
  installed: "Installé",
};

export default async function KitDeliveryPage() {
  const merchant = await requireMerchantContext();
  const supabase = await createServerSupabaseClient();
  const kit = await getKitDeliveryInfo(supabase, merchant.merchantId);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Kit de démarrage</h1>
      <p className="mt-1 text-sm text-gray-600">
        Présentoir + QR code à poser sur votre comptoir. Choisissez comment le recevoir.
      </p>

      {kit.method ? (
        <div className="mt-8 max-w-lg rounded-2xl border border-gray-100 p-6">
          <p className="text-sm text-gray-500">Méthode choisie</p>
          <p className="mt-1 font-medium text-gray-900">{METHOD_LABELS[kit.method]}</p>
          <p className="mt-4 text-sm text-gray-500">Statut</p>
          <p className="mt-1 font-medium text-gray-900">{STATUS_LABELS[kit.status]}</p>
          {kit.address && (
            <>
              <p className="mt-4 text-sm text-gray-500">Adresse de livraison</p>
              <p className="mt-1 text-sm text-gray-700">
                {kit.address.name}
                <br />
                {kit.address.line1}
                {kit.address.line2 ? (
                  <>
                    <br />
                    {kit.address.line2}
                  </>
                ) : null}
                <br />
                {kit.address.postalCode} {kit.address.city}, {kit.address.country}
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="mt-8">
          <KitDeliveryForm />
        </div>
      )}
    </div>
  );
}
