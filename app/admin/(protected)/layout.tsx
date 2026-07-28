import Link from "next/link";
import { requireAdminContext } from "@/lib/adminAuth";
import { adminSignOut } from "@/lib/actions/adminAuth";
import { MobileNav } from "@/components/MobileNav";

const navItems = [
  { href: "/admin", label: "Vue d'ensemble" },
  { href: "/admin/merchants", label: "Commerçants" },
  { href: "/admin/invoices", label: "Factures" },
  { href: "/admin/kits", label: "Kits en attente" },
  { href: "/admin/orders", label: "Commandes boutique" },
  { href: "/admin/audit", label: "Journal d'audit" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminContext();

  return (
    <div className="flex min-h-full flex-1">
      <aside className="admin-chrome hidden w-60 shrink-0 border-r border-gray-100 p-6 sm:flex sm:flex-col">
        <Link href="/admin" className="mb-8 text-lg font-semibold tracking-tight">
          Fidély admin
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
        {admin.email && <p className="mb-2 truncate text-xs text-gray-400">{admin.email}</p>}
        <form action={adminSignOut}>
          <button
            type="submit"
            className="mt-6 w-full rounded-lg px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50"
          >
            Se déconnecter
          </button>
        </form>
      </aside>

      <div className="flex-1">
        <header className="admin-chrome flex items-center justify-between border-b border-gray-100 px-6 py-4 sm:hidden">
          <span className="font-semibold">Fidély admin</span>
          <MobileNav navItems={navItems} brand="Fidély admin" />
        </header>
        <main className="p-6 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
