import { redirect } from "next/navigation";
import { getOnboardingMerchant } from "@/lib/merchant";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CardCustomizer } from "@/components/dashboard/CardCustomizer";
import { saveOnboardingPersonalisation } from "@/lib/actions/onboarding";

export default async function OnboardingPersonalisationPage() {
  const merchant = await getOnboardingMerchant();
  if (!merchant) redirect("/onboarding");
  if (merchant.onboardingCompleted) redirect("/dashboard");

  const supabase = await createServerSupabaseClient();
  const [{ data: merchantRow }, { data: program }] = await Promise.all([
    supabase
      .from("merchants")
      .select(
        "brand_color, text_color, stamp_style, sector, logo_url, background_photo_url, background_photo_enabled, name_display_mode"
      )
      .eq("id", merchant.merchantId)
      .single(),
    supabase
      .from("loyalty_programs")
      .select("display_mode, stamp_count, reward_threshold, reward_description")
      .eq("merchant_id", merchant.merchantId)
      .single(),
  ]);

  return (
    <div>
      <h1 className="text-xl font-semibold">Personnalisez votre carte</h1>
      <p className="mt-1 mb-8 text-sm text-gray-600">
        Secteur, couleur, logo — c&apos;est exactement ce que vos clients verront dans leur Wallet.
      </p>
      <CardCustomizer
        businessName={merchant.businessName}
        displayMode={program?.display_mode ?? "stamps"}
        stampCount={program?.stamp_count ?? 10}
        rewardThreshold={program?.reward_threshold ?? 10}
        rewardDescription={program?.reward_description ?? ""}
        initialColor={merchantRow?.brand_color ?? "#111827"}
        initialTextColor={merchantRow?.text_color ?? null}
        initialStampStyle={merchantRow?.stamp_style ?? "circle"}
        initialSector={merchantRow?.sector ?? null}
        initialLogoUrl={merchantRow?.logo_url ?? null}
        initialBackgroundPhotoUrl={merchantRow?.background_photo_url ?? null}
        initialBackgroundPhotoEnabled={merchantRow?.background_photo_enabled ?? false}
        initialNameDisplayMode={merchantRow?.name_display_mode ?? "text"}
        action={saveOnboardingPersonalisation}
        submitLabel="Continuer"
      />
    </div>
  );
}
