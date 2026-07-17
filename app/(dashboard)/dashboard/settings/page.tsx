import { requireMerchantContext } from "@/lib/merchant";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/dashboard/SettingsForm";
import { OpeningHoursForm } from "@/components/dashboard/OpeningHoursForm";
import { MenuManager } from "@/components/dashboard/MenuManager";
import { GalleryManager } from "@/components/dashboard/GalleryManager";
import {
  getMerchantGalleryPhotos,
  getMerchantMenuItems,
  getMerchantPageExtras,
} from "@/lib/merchantPageContent";

export default async function SettingsPage() {
  const merchant = await requireMerchantContext();
  const supabase = await createServerSupabaseClient();

  const [extras, menuItems, galleryPhotos] = await Promise.all([
    getMerchantPageExtras(supabase, merchant.merchantId),
    getMerchantMenuItems(supabase, merchant.merchantId),
    getMerchantGalleryPhotos(supabase, merchant.merchantId),
  ]);

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-2xl font-semibold">Paramètres</h1>
        <p className="mt-1 text-sm text-gray-600">
          Ces informations alimentent votre page publique, accessible depuis la carte de
          fidélité de vos clients.
        </p>
      </div>

      <section>
        <h2 className="text-lg font-medium text-gray-900">Coordonnées</h2>
        <div className="mt-4">
          <SettingsForm
            googleMapsLink={extras.googleMapsLink}
            googleReviewLink={extras.googleReviewLink}
            phone={extras.phone}
            address={extras.address}
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium text-gray-900">Horaires d&apos;ouverture</h2>
        <div className="mt-4">
          <OpeningHoursForm hours={extras.openingHours} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium text-gray-900">Menu / catalogue</h2>
        <div className="mt-4">
          <MenuManager items={menuItems} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium text-gray-900">Galerie photos</h2>
        <div className="mt-4">
          <GalleryManager photos={galleryPhotos} />
        </div>
      </section>
    </div>
  );
}
