import { redirect } from "next/navigation";
import { getOnboardingMerchant } from "@/lib/merchant";
import { OnboardingInfosForm } from "@/components/auth/OnboardingInfosForm";

export default async function OnboardingPage() {
  const merchant = await getOnboardingMerchant();
  if (merchant) {
    redirect(merchant.onboardingCompleted ? "/dashboard" : "/onboarding/personnalisation");
  }

  return (
    <div className="text-center">
      <h1 className="text-xl font-semibold">Configurez votre programme de fidélité</h1>
      <p className="mt-1 mb-6 text-sm text-gray-600">
        Quatre étapes rapides. Vous pourrez tout modifier plus tard dans votre tableau de bord.
      </p>
      <OnboardingInfosForm />
    </div>
  );
}
