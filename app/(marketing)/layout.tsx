import Link from "next/link";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-gray-100">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight text-gray-900">
            Fidély
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/pricing" className="text-gray-600 hover:text-gray-900">
              Tarifs
            </Link>
            <Link href="/login" className="text-gray-600 hover:text-gray-900">
              Connexion
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500"
            >
              Essayer gratuitement
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Fidély. Tous droits réservés.
      </footer>
    </>
  );
}
