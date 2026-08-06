import Link from "next/link";
import { requireMerchantContext } from "@/lib/merchant";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProgramForm } from "@/components/dashboard/ProgramForm";
import { CardCustomizer } from "@/components/dashboard/CardCustomizer";

export default async function ProgramPage() {
  const merchant = await requireMerchantContext();
  const supabase = await createServerSupabaseClient();

  const [{ data: program }, { data: merchantRow }] = await Promise.all([
    supabase
      .from("loyalty_programs")
      .select(
        "name, display_mode, points_per_scan, stamp_count, points_per_euro, reward_threshold, reward_description"
      )
      .eq("merchant_id", merchant.merchantId)
      .single(),
    supabase
      .from("merchants")
      .select(
        "brand_color, text_color, stamp_style, sector, logo_url, background_photo_url, background_photo_enabled, name_display_mode"
      )
      .eq("id", merchant.merchantId)
      .single(),
  ]);

  if (!program) {
    return <p className="text-sm text-red-600">Programme introuvable.</p>;
  }

  return (
    <div className="space-y-14">
      <div>
        <h1 className="text-2xl font-semibold">Programme de fidélité</h1>
        <p className="mt-1 text-sm text-gray-600">
          Ces réglages s&apos;appliquent à toutes les cartes de vos clients.
        </p>
        <div className="mt-8">
          <ProgramForm program={program} />
        </div>

        <div className="mt-12">
          <Link
            href="/dashboard/qr-codes"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Gérer vos QR codes (inscription, offres) →
          </Link>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-10">
        <h2 className="text-xl font-semibold">Personnalisation de la carte</h2>
        <p className="mt-1 text-sm text-gray-600">
          Couleur et style de tampons affichés sur la carte de vos clients.
        </p>
        <div className="mt-8">
          <CardCustomizer
            businessName={merchant.businessName}
            displayMode={program.display_mode}
            stampCount={program.stamp_count}
            initialColor={merchantRow?.brand_color ?? merchant.brandColor}
            initialTextColor={merchantRow?.text_color ?? null}
            initialStampStyle={merchantRow?.stamp_style ?? "circle"}
            initialSector={merchantRow?.sector ?? null}
            initialLogoUrl={merchantRow?.logo_url ?? merchant.logoUrl}
            initialBackgroundPhotoUrl={merchantRow?.background_photo_url ?? null}
            initialBackgroundPhotoEnabled={merchantRow?.background_photo_enabled ?? false}
            initialNameDisplayMode={merchantRow?.name_display_mode ?? "text"}
          />
        </div>
      </div>
    </div>
  );
}
