import Link from "next/link";
import { redirect } from "next/navigation";
import { getOnboardingMerchant } from "@/lib/merchant";

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 8a6 6 0 1 1 12 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 18a2.5 2.5 0 0 0 5 0" />
    </svg>
  );
}

export default async function OnboardingNotificationsPage() {
  const merchant = await getOnboardingMerchant();
  if (!merchant) redirect("/onboarding");

  return (
    <div className="text-center">
      <h1 className="text-xl font-semibold">Envoyez des notifications en illimité</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
        Vos clients ont votre carte dans leur téléphone : notifiez-les quand vous voulez, autant
        de fois que vous voulez. Une offre, une nouveauté, un coup de pouce les jours creux, en
        direct sur leur écran.
      </p>

      <div className="mx-auto mt-8 max-w-xs rounded-2xl bg-gray-50 p-6">
        <div className="rounded-2xl bg-white px-4 py-3 text-left shadow-lg ring-1 ring-black/5">
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-900 text-white">
              <BellIcon />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-semibold text-gray-900">
                  {merchant.businessName}
                </span>
                <span className="shrink-0 text-xs text-gray-400">maintenant</span>
              </div>
              <p className="mt-0.5 text-sm text-gray-700">Offre spéciale ce week-end !</p>
            </div>
          </div>
        </div>
      </div>

      <Link
        href="/dashboard/billing"
        className="mt-10 inline-block w-full max-w-sm rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
      >
        Terminer
      </Link>
    </div>
  );
}
