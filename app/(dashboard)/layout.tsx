import Link from "next/link";
import { redirect } from "next/navigation";
import { requireMerchantContext } from "@/lib/merchant";
import { signOut } from "@/lib/actions/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getKitDeliveryInfo } from "@/lib/kitDeliveryData";
import { MerchantSwitcher } from "@/components/dashboard/MerchantSwitcher";
import { SubscriptionGate } from "@/components/dashboard/SubscriptionGate";
import { MobileNav } from "@/components/MobileNav";

const navItems = [
  { href: "/dashboard", label: "Vue d'ensemble" },
  { href: "/dashboard/scan", label: "Scanner" },
  { href: "/dashboard/customers", label: "Clients" },
  { href: "/dashboard/program", label: "Programme" },
  { href: "/dashboard/qr-codes", label: "QR codes" },
  { href: "/dashboard/kit-delivery", label: "Kit de démarrage" },
  { href: "/dashboard/notifications", label: "Notifications" },
  { href: "/dashboard/billing", label: "Facturation" },
  { href: "/boutique", label: "Boutique" },
  { href: "/dashboard/staff", label: "Équipe" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const merchant = await requireMerchantContext();
  // A merchant row exists as soon as step 1 of the wizard runs, but the
  // dashboard shouldn't be reachable until step 3 actually finishes it
  // (see saveOnboardingProgram in lib/actions/onboarding.ts) — otherwise a
  // merchant could skip personalisation/program setup by just typing
  // /dashboard in the address bar mid-wizard.
  if (!merchant.onboardingCompleted) redirect("/onboarding/personnalisation");
  const supabase = await createServerSupabaseClient();
  const kit = await getKitDeliveryInfo(supabase, merchant.merchantId);
  const showKitBanner = merchant.subscriptionStatus === "active" && kit.method === null;

  return (
    <div className="flex min-h-full flex-1">
      <aside className="hidden w-60 shrink-0 border-r border-gray-100 p-6 sm:flex sm:flex-col">
        <Link href="/dashboard" className="mb-8 text-lg font-semibold tracking-tight">
          Fidély
        </Link>
        <nav className="flex flex-1 flex-col gap-1 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={signOut}>
          <button
            type="submit"
            className="mt-6 w-full rounded-lg px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50"
          >
            Se déconnecter
          </button>
        </form>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-gray-100 px-6 py-4 sm:hidden">
          <span className="font-semibold">{merchant.businessName}</span>
          <MobileNav navItems={navItems} brand="Fidély" />
        </header>
        <header className="hidden items-center justify-between border-b border-gray-100 px-8 py-4 sm:flex">
          {merchant.allMerchants.length > 1 ? (
            <MerchantSwitcher merchants={merchant.allMerchants} activeMerchantId={merchant.merchantId} />
          ) : (
            <span className="text-sm text-gray-500">{merchant.businessName}</span>
          )}
          <div className="flex items-center gap-2">
            {merchant.subscriptionStatus === "paused" && (
              <Link
                href="/dashboard/billing"
                className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700"
              >
                Abonnement en pause
              </Link>
            )}
            {merchant.subscriptionStatus !== "active" &&
              merchant.subscriptionStatus !== "paused" &&
              merchant.subscriptionStatus !== "past_due" && (
                <Link
                  href="/dashboard/billing"
                  className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700"
                >
                  Facturation à finaliser
                </Link>
              )}
            {merchant.subscriptionStatus === "past_due" && (
              <Link
                href="/dashboard/billing"
                className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700"
              >
                Abonnement suspendu — paiement échoué
              </Link>
            )}
            {showKitBanner && (
              <Link
                href="/dashboard/kit-delivery"
                className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700"
              >
                Choisir la livraison du kit
              </Link>
            )}
          </div>
        </header>
        <main className="flex flex-1 flex-col p-6 sm:p-8">
          <SubscriptionGate subscriptionStatus={merchant.subscriptionStatus}>
            {children}
          </SubscriptionGate>
        </main>
      </div>
    </div>
  );
}
