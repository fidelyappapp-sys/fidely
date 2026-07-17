import Link from "next/link";
import { requireMerchantContext } from "@/lib/merchant";
import { signOut } from "@/lib/actions/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getKitDeliveryInfo } from "@/lib/kitDeliveryData";

const navItems = [
  { href: "/dashboard", label: "Vue d'ensemble" },
  { href: "/dashboard/scan", label: "Scanner" },
  { href: "/dashboard/customers", label: "Clients" },
  { href: "/dashboard/program", label: "Programme" },
  { href: "/dashboard/qr-codes", label: "QR codes" },
  { href: "/dashboard/kit-delivery", label: "Kit de démarrage" },
  { href: "/dashboard/notifications", label: "Notifications" },
  { href: "/dashboard/billing", label: "Facturation" },
  { href: "/dashboard/staff", label: "Équipe" },
  { href: "/dashboard/settings", label: "Paramètres" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const merchant = await requireMerchantContext();
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
        </header>
        <header className="hidden items-center justify-between border-b border-gray-100 px-8 py-4 sm:flex">
          <span className="text-sm text-gray-500">{merchant.businessName}</span>
          <div className="flex items-center gap-2">
            {merchant.subscriptionStatus !== "active" && (
              <Link
                href="/dashboard/billing"
                className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700"
              >
                Facturation à finaliser
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
        <main className="p-6 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
