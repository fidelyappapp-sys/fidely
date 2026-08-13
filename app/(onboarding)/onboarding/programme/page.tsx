import { redirect } from "next/navigation";
import { getOnboardingMerchant } from "@/lib/merchant";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProgramForm } from "@/components/dashboard/ProgramForm";
import { saveOnboardingProgram } from "@/lib/actions/onboarding";

export default async function OnboardingProgrammePage() {
  const merchant = await getOnboardingMerchant();
  if (!merchant) redirect("/onboarding");
  if (merchant.onboardingCompleted) redirect("/dashboard");

  const supabase = await createServerSupabaseClient();
  const [{ data: program }, { data: merchantRow }] = await Promise.all([
    supabase
      .from("loyalty_programs")
      .select(
        "id, name, display_mode, points_per_scan, stamp_count, points_per_euro, reward_threshold, reward_description"
      )
      .eq("merchant_id", merchant.merchantId)
      .single(),
    supabase.from("merchants").select("sector").eq("id", merchant.merchantId).single(),
  ]);

  if (!program) redirect("/onboarding");

  return (
    <div>
      <h1 className="text-xl font-semibold">Votre programme de fidélité</h1>
      <p className="mt-1 mb-8 text-sm text-gray-600">
        Tampons ou points, et la récompense qui donne envie de revenir.
      </p>
      <ProgramForm
        program={program}
        programId={program.id}
        sector={merchantRow?.sector ?? null}
        action={saveOnboardingProgram}
        submitLabel="Terminer"
      />
    </div>
  );
}
