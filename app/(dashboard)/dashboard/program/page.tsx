import Link from "next/link";
import { requireMerchantContext } from "@/lib/merchant";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProgramForm } from "@/components/dashboard/ProgramForm";
import { CardCustomizer } from "@/components/dashboard/CardCustomizer";
import { PosSelector } from "@/components/dashboard/PosSelector";
import { CityEditor } from "@/components/dashboard/CityEditor";

export default async function ProgramPage({
  searchParams,
}: {
  searchParams: Promise<{ pos?: string }>;
}) {
  const merchant = await requireMerchantContext();
  const { pos } = await searchParams;
  const supabase = await createServerSupabaseClient();

  const [{ data: pointsOfSale }, { data: merchantRow }] = await Promise.all([
    supabase
      .from("merchant_qr_codes")
      .select(
        "id, label, city, kind, loyalty_program_id, brand_color, text_color, stamp_style, logo_url, background_photo_url, background_photo_enabled, name_display_mode"
      )
      .eq("merchant_id", merchant.merchantId)
      .in("kind", ["main", "join_source"])
      .order("created_at", { ascending: true }),
    supabase
      .from("merchants")
      .select(
        "brand_color, text_color, stamp_style, logo_url, background_photo_url, background_photo_enabled, name_display_mode"
      )
      .eq("id", merchant.merchantId)
      .single(),
  ]);

  const selectedPos =
    pointsOfSale?.find((row) => row.id === pos) ??
    pointsOfSale?.find((row) => row.kind === "main") ??
    pointsOfSale?.[0] ??
    null;

  if (!selectedPos || !selectedPos.loyalty_program_id) {
    return <p className="text-sm text-red-600">Point de vente introuvable.</p>;
  }

  const { data: program } = await supabase
    .from("loyalty_programs")
    .select(
      "id, name, display_mode, points_per_scan, stamp_count, points_per_euro, reward_threshold, reward_description"
    )
    .eq("id", selectedPos.loyalty_program_id)
    .single();

  if (!program) {
    return <p className="text-sm text-red-600">Programme introuvable.</p>;
  }

  return (
    <div className="space-y-14">
      <div>
        <h1 className="text-2xl font-semibold">Programme de fidélité</h1>
        <p className="mt-1 text-sm text-gray-600">
          Chaque point de vente a son propre programme, indépendant des autres.
        </p>

        {pointsOfSale && pointsOfSale.length > 1 && (
          <div className="mt-4">
            <PosSelector
              items={pointsOfSale.map((row) => ({ id: row.id, label: row.label, city: row.city }))}
              selectedId={selectedPos.id}
              basePath="/dashboard/program"
            />
          </div>
        )}

        <div className="mt-4">
          <CityEditor key={selectedPos.id} id={selectedPos.id} city={selectedPos.city} />
        </div>

        <div className="mt-8">
          <ProgramForm key={selectedPos.id} program={program} programId={program.id} />
        </div>

        <div className="mt-12">
          <Link
            href="/dashboard/qr-codes"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Gérer vos QR codes / points de vente →
          </Link>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-10">
        <h2 className="text-xl font-semibold">Personnalisation de la carte</h2>
        <p className="mt-1 text-sm text-gray-600">
          Couleur, logo et texte affichés sur la carte de vos clients.
        </p>
        <div className="mt-8">
          <CardCustomizer
            key={selectedPos.id}
            posId={selectedPos.id}
            businessName={merchant.businessName}
            city={selectedPos.city}
            displayMode={program.display_mode}
            stampCount={program.stamp_count}
            rewardThreshold={program.reward_threshold}
            rewardDescription={program.reward_description}
            initialColor={selectedPos.brand_color ?? merchantRow?.brand_color ?? merchant.brandColor}
            initialTextColor={selectedPos.text_color ?? merchantRow?.text_color ?? null}
            initialStampStyle={selectedPos.stamp_style ?? merchantRow?.stamp_style ?? "circle"}
            initialLogoUrl={selectedPos.logo_url ?? merchantRow?.logo_url ?? merchant.logoUrl}
            initialBackgroundPhotoUrl={selectedPos.background_photo_url ?? merchantRow?.background_photo_url ?? null}
            initialBackgroundPhotoEnabled={
              selectedPos.background_photo_enabled ?? merchantRow?.background_photo_enabled ?? false
            }
            initialNameDisplayMode={selectedPos.name_display_mode ?? merchantRow?.name_display_mode ?? "text"}
          />
        </div>
      </div>
    </div>
  );
}
