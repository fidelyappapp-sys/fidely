import Image from "next/image";
import Link from "next/link";
import { WalletCard } from "./WalletCard";

const avisGooglePoints = [
  {
    icon: "★",
    title: "Plus d'avis 5 étoiles",
    description: "Accès facilité à votre page Google.",
  },
  {
    icon: "◉",
    title: "Technologie NFC intégrée",
    description: "Sans application, en un instant.",
  },
  {
    icon: "▦",
    title: "QR code universel",
    description: "Compatible avec tous les smartphones.",
  },
  {
    icon: "✓",
    title: "Simple, rapide et efficace",
    description: "Design professionnel, installation facile.",
  },
];

const cardePoints = [
  {
    icon: "◈",
    title: "100% digital",
    description: "Plus de carte papier à oublier ou perdre.",
  },
  {
    icon: "◔",
    title: "Notifications illimitées",
    description: "Envoyées directement sur le téléphone du client.",
  },
  {
    icon: "◐",
    title: "Personnalisable à 100%",
    description: "Couleurs, logo, récompense.",
  },
  {
    icon: "⌗",
    title: "QR code + NFC",
    description: "Scanné en une seconde en caisse.",
  },
];

export function OffersSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold tracking-wide text-indigo-600 uppercase">
          Nos offres
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Deux solutions pour faire grandir votre commerce
        </h2>
        <p className="mt-4 text-gray-600">
          À installer séparément ou ensemble, selon ce dont votre commerce a besoin.
        </p>
      </div>

      <div className="mt-14 grid gap-8 lg:grid-cols-2 lg:items-stretch">
        <div className="group flex flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-100/50">
          <div className="relative h-56 overflow-hidden bg-gray-100 sm:h-64">
            <Image
              src="/avis-google-flyer.jpg"
              alt="Plaque Fidély avec QR code et puce NFC : Laissez-nous un avis sur Internet"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover object-[50%_30%] transition-transform duration-500 group-hover:scale-105"
            />
          </div>

          <div className="flex flex-1 flex-col p-6 sm:p-8">
            <h3 className="text-xl font-bold text-gray-900">
              Plus d&apos;avis 5 étoiles, sans lever le petit doigt
            </h3>
            <p className="mt-1 text-sm text-gray-500">Plaque avis Google — NFC &amp; QR code</p>

            <ul className="mt-6 space-y-4">
              {avisGooglePoints.map((point) => (
                <li key={point.title} className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm text-indigo-600">
                    {point.icon}
                  </span>
                  <span className="text-sm text-gray-600">
                    <span className="font-medium text-gray-900">{point.title}</span> —{" "}
                    {point.description}
                  </span>
                </li>
              ))}
            </ul>

            <Link
              href="/avis-google"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-3 font-medium text-white shadow-lg shadow-indigo-600/25 transition hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-xl hover:shadow-indigo-600/30"
            >
              En savoir plus
            </Link>
          </div>
        </div>

        <div className="group flex flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-100/50">
          <div className="relative h-56 overflow-hidden bg-gradient-to-br from-gray-50 to-indigo-50/60 sm:h-64">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative h-40 w-full max-w-[280px]">
                <WalletCard
                  variant="apple"
                  points={140}
                  className="absolute top-0 left-1/2 origin-top -translate-x-[58%] -rotate-6 scale-[0.72] transition-transform duration-500 group-hover:-translate-y-1"
                />
                <WalletCard
                  variant="google"
                  business="Salon Karim Coiffure"
                  points={60}
                  animated={false}
                  className="absolute top-8 left-1/2 origin-top -translate-x-[42%] rotate-6 scale-[0.72] transition-transform duration-500 group-hover:-translate-y-1"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col p-6 sm:p-8">
            <h3 className="text-xl font-bold text-gray-900">
              Votre carte de fidélité digitale
            </h3>
            <p className="mt-1 text-sm text-gray-500">Abonnement Apple Wallet &amp; Google Wallet</p>

            <ul className="mt-6 space-y-4">
              {cardePoints.map((point) => (
                <li key={point.title} className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm text-indigo-600">
                    {point.icon}
                  </span>
                  <span className="text-sm text-gray-600">
                    <span className="font-medium text-gray-900">{point.title}</span> —{" "}
                    {point.description}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex items-center gap-3">
              <p className="text-2xl font-bold text-gray-900">
                À partir de 30€ <span className="text-base font-normal text-gray-500">/mois</span>
              </p>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                1er mois offert
              </span>
            </div>

            <Link
              href="/pricing"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-3 font-medium text-white shadow-lg shadow-indigo-600/25 transition hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-xl hover:shadow-indigo-600/30"
            >
              Je m&apos;abonne
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
