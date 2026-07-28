"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const BILLING_PATH = "/dashboard/billing";

export function SubscriptionGate({
  subscriptionStatus,
  children,
}: {
  subscriptionStatus: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (subscriptionStatus !== "past_due" || pathname.startsWith(BILLING_PATH)) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
      <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-8">
        <p className="text-lg font-semibold text-red-900">Compte suspendu</p>
        <p className="mt-2 text-sm text-red-800">
          Le dernier paiement de votre abonnement a échoué. L&apos;accès au tableau de bord et
          au scan est suspendu jusqu&apos;à la régularisation de votre facturation.
        </p>
        <Link
          href={BILLING_PATH}
          className="mt-6 inline-block rounded-full bg-red-600 px-6 py-2 text-sm font-medium text-white hover:bg-red-500"
        >
          Régulariser ma facturation
        </Link>
      </div>
    </div>
  );
}
