import Link from "next/link";
import { requireMerchantContext } from "@/lib/merchant";
import { signOut } from "@/lib/actions/auth";

const navItems = [
  { href: "/dashboard", label: "Vue d'ensemble" },
  { href: "/dashboard/scan", label: "Scanner" },
  { href: "/dashboard/customers", label: "Clients" },
  { href: "/dashboard/program", label: "Programme" },
  { href: "/dashboard/billing", label: "Facturation" },
  { href: "/dashboard/staff", label: "Équipe" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const merchant = await requireMerchantContext();

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
          {merchant.subscriptionStatus !== "active" && (
            <Link
              href="/dashboard/billing"
              className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700"
            >
              Facturation à finaliser
            </Link>
          )}
        </header>
        <main className="p-6 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
