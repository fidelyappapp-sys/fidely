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
      .select("name, points_per_scan, reward_threshold, reward_description")
      .eq("merchant_id", merchant.merchantId)
      .single(),
    supabase
      .from("merchants")
      .select("brand_color, stamp_style")
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
            rewardThreshold={program.reward_threshold}
            initialColor={merchantRow?.brand_color ?? merchant.brandColor}
            initialStampStyle={merchantRow?.stamp_style ?? "circle"}
          />
        </div>
      </div>
    </div>
  );
}

