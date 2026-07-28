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

  // Only "active" (subscribed) and "paused" (was subscribed, temporarily
  // paused) merchants have a card on file and get full access. Everything
  // else — "incomplete" (never subscribed), "past_due", "canceled", etc. —
  // is blocked outside of the billing page itself, so no merchant can use
  // the scanner/QR codes without ever registering a payment method.
  const isAllowed = subscriptionStatus === "active" || subscriptionStatus === "paused";

  if (isAllowed || pathname.startsWith(BILLING_PATH)) {
    return <>{children}</>;
  }

  const isPastDue = subscriptionStatus === "past_due";

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
      <div
        className={`max-w-md rounded-2xl border p-8 ${
          isPastDue ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
        }`}
      >
        <p className={`text-lg font-semibold ${isPastDue ? "text-red-900" : "text-amber-900"}`}>
          {isPastDue ? "Compte suspendu" : "Activez votre abonnement"}
        </p>
        <p className={`mt-2 text-sm ${isPastDue ? "text-red-800" : "text-amber-800"}`}>
          {isPastDue
            ? "Le dernier paiement de votre abonnement a échoué. L'accès au tableau de bord et au scan est suspendu jusqu'à la régularisation de votre facturation."
            : "Enregistrez une carte bancaire pour activer votre abonnement (0,10€/scan, minimum 30€/mois) — le tableau de bord, les QR codes et le scanner ne sont accessibles qu'une fois l'abonnement activé."}
        </p>
        <Link
          href={BILLING_PATH}
          className={`mt-6 inline-block rounded-full px-6 py-2 text-sm font-medium text-white ${
            isPastDue ? "bg-red-600 hover:bg-red-500" : "bg-amber-600 hover:bg-amber-500"
          }`}
        >
          {isPastDue ? "Régulariser ma facturation" : "Activer mon abonnement"}
        </Link>
      </div>
    </div>
  );
}
