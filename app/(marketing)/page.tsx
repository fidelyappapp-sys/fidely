import Link from "next/link";
import { RevenueStats } from "@/components/marketing/RevenueStats";
import { Testimonials } from "@/components/marketing/Testimonials";

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
    <div>
      <section className="mx-auto max-w-5xl px-6 py-20 text-center">
        <span className="inline-flex items-center rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700">
          Fidélisez vos clients, augmentez votre chiffre d&apos;affaires
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          La carte de fidélité digitale pour votre commerce
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
          Fidély génère des cartes de fidélité Apple Wallet et Google Wallet pour vos clients,
          scannables en caisse en un instant. Inscription en 2 minutes.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-full bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-500"
          >
            Créer mon compte commerçant
          </Link>
          <Link
            href="/pricing"
            className="rounded-full border border-gray-300 px-6 py-3 font-medium text-gray-900 hover:bg-gray-50"
          >
            Voir les tarifs
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-gray-100 p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-lg text-indigo-600">
                {feature.icon}
              </span>
              <h3 className="mt-4 font-semibold text-gray-900">{feature.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <RevenueStats />
      <Testimonials />

      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Prêt à faire revenir vos clients plus souvent ?
          </h2>
          <p className="mt-3 text-gray-600">
            Créez votre programme de fidélité en 2 minutes, sans engagement.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-full bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-500"
          >
            Créer mon compte commerçant
          </Link>
        </div>
      </section>
    </div>
  );
}
