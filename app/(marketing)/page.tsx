import Link from "next/link";
import { RevenueStats } from "@/components/marketing/RevenueStats";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { WalletShowcase } from "@/components/marketing/WalletShowcase";
import { Reveal } from "@/components/marketing/Reveal";
import { HeroVisual } from "@/components/marketing/HeroVisual";
import { KeyStats } from "@/components/marketing/KeyStats";
import { CardsCarousel } from "@/components/marketing/CardsCarousel";

const features = [
  {
    icon: "▦",
    title: "QR codes automatiques",
    description:
      "Chaque client reçoit un QR code unique généré automatiquement, lié à sa carte de fidélité.",
  },
  {
    icon: "◈",
    title: "Apple Wallet & Google Wallet",
    description:
      "La carte de fidélité s'ajoute en un tap au Wallet du client — pas d'application à installer.",
  },
  {
    icon: "⌗",
    title: "Scan en caisse",
    description:
      "Vos équipes scannent le QR du client depuis un simple navigateur pour attribuer les points.",
  },
  {
    icon: "◔",
    title: "Notifications automatiques",
    description:
      "À chaque scan, le pass du client se met à jour à distance et affiche son nouveau solde de points.",
  },
  {
    icon: "€",
    title: "Facturation automatique",
    description:
      "Paiement prélevé automatiquement chaque mois via Stripe, au prorata de votre usage réel.",
  },
  {
    icon: "✓",
    title: "Une seule offre, tout inclus",
    description: "Pas de paliers, pas de fonctionnalités cachées derrière un plan supérieur.",
  },
];

export default function LandingPage() {
  return (
    <div className="overflow-hidden">
      <section className="relative">
        <div
          aria-hidden
          className="animate-drift pointer-events-none absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full bg-indigo-200/50 blur-3xl"
        />
        <div
          aria-hidden
          className="animate-drift pointer-events-none absolute -top-20 right-[-10rem] h-[28rem] w-[28rem] rounded-full bg-violet-200/50 blur-3xl"
          style={{ animationDelay: "-7s" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_1px_1px,_theme(colors.gray.200)_1px,_transparent_0)] bg-[size:32px_32px] opacity-40"
        />

        <div className="relative mx-auto grid max-w-6xl gap-16 px-6 py-24 lg:grid-cols-2 lg:items-center lg:py-32">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700 ring-1 ring-indigo-100">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
              Fidélisez vos clients, augmentez votre chiffre d&apos;affaires
            </span>
            <h1 className="mt-6 text-5xl font-bold tracking-tight text-balance text-gray-900 sm:text-6xl">
              La carte de fidélité{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                digitale
              </span>{" "}
              pour votre commerce
            </h1>
            <p className="mt-6 max-w-xl text-lg text-gray-600">
              Fidély génère des cartes de fidélité Apple Wallet et Google Wallet pour vos
              clients, scannables en caisse en un instant. Inscription en 2 minutes.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="rounded-full bg-indigo-600 px-6 py-3 font-medium text-white shadow-lg shadow-indigo-600/25 transition hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-xl hover:shadow-indigo-600/30"
              >
                Créer mon compte commerçant
              </Link>
              <Link
                href="/pricing"
                className="rounded-full border border-gray-300 px-6 py-3 font-medium text-gray-900 transition hover:-translate-y-0.5 hover:bg-gray-50"
              >
                Voir les tarifs
              </Link>
            </div>
            <p className="mt-6 text-sm text-gray-500">
              0,10€ par scan · minimum 30€/mois · sans engagement
            </p>
          </div>

          <div className="flex justify-center lg:justify-end">
            <HeroVisual />
          </div>
        </div>
      </section>

      <Reveal>
        <KeyStats />
      </Reveal>

      <Reveal>
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <Reveal key={feature.title} delay={i * 60}>
                <div className="group relative h-full overflow-hidden rounded-2xl border border-gray-100 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-100/50">
                  <span
                    aria-hidden
                    className="animate-card-sheen pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                    style={{ animationDelay: `${i * 0.9}s` }}
                  />
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-lg text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                    {feature.icon}
                  </span>
                  <h3 className="mt-4 font-semibold text-gray-900">{feature.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <HowItWorks />
      </Reveal>

      <Reveal>
        <WalletShowcase />
      </Reveal>

      <CardsCarousel />

      <Reveal>
        <RevenueStats />
      </Reveal>

      <section className="relative overflow-hidden py-24">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-600 to-violet-700"
        />
        <div
          aria-hidden
          className="animate-drift pointer-events-none absolute top-1/2 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-3xl"
        />
        <Reveal>
          <div className="relative mx-auto max-w-2xl px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Prêt à faire revenir vos clients plus souvent ?
            </h2>
            <p className="mt-3 text-indigo-100">
              Créez votre programme de fidélité en 2 minutes, sans engagement.
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-block rounded-full bg-white px-6 py-3 font-medium text-indigo-700 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              Créer mon compte commerçant
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
