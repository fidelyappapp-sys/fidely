import Link from "next/link";
import { Reveal } from "@/components/marketing/Reveal";

const INCLUDED: { icon: string; title: string; description: string }[] = [
  {
    icon: "◈",
    title: "Carte de fidélité 100% digitale",
    description: "Apple Wallet ET Google Wallet — plus de carte papier à oublier ou perdre.",
  },
  {
    icon: "🎨",
    title: "Personnalisation complète",
    description: "Couleurs sur-mesure (sélecteur RVB/Hex), logo, bannière — votre identité de marque à 100%.",
  },
  {
    icon: "⚙",
    title: "Système flexible",
    description: "Tampons ou points, seuil de récompense entièrement configurable par le commerçant.",
  },
  {
    icon: "🎁",
    title: "Récompenses sur-mesure",
    description: "Définissez votre propre récompense, modifiable à tout moment depuis votre dashboard.",
  },
  {
    icon: "⌗",
    title: "QR code + NFC intégrés",
    description: "Le client scanne ou pose son téléphone, sans application à télécharger.",
  },
  {
    icon: "◔",
    title: "Notifications illimitées",
    description:
      "Envoyez des offres, nouveautés ou rappels directement sur l'écran verrouillé de vos clients, aussi souvent que vous voulez.",
  },
  {
    icon: "▤",
    title: "Présentoir physique inclus et livré",
    description:
      "Contrairement à la concurrence, le matériel de présentation est fourni et livré, pas facturé en supplément.",
  },
  {
    icon: "📊",
    title: "Dashboard commerçant complet",
    description: "Suivez vos clients, vos points distribués, gérez votre programme en temps réel.",
  },
  {
    icon: "⚡",
    title: "Installation en quelques minutes",
    description: "Aucune compétence technique requise.",
  },
];

const WHY_FIDELY: string[] = [
  "Un modèle tarifaire qui s'adapte à votre activité, pas un prix fixe déconnecté de votre usage réel",
  "Jusqu'à 3 fois moins cher que les solutions équivalentes du marché (souvent 80€+/mois ailleurs)",
  "1 mois offert pour tester sans risque",
  "Support réactif, conçu et pensé en France",
  "Pas de frais cachés",
];

const SIMULATOR: { clients: string; price: string }[] = [
  { clients: "100 clients", price: "30€" },
  { clients: "500 clients", price: "50€" },
  { clients: "1 000 clients", price: "100€" },
];

export default function AbonnementPage() {
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

        <div className="relative mx-auto max-w-3xl px-6 py-24 text-center lg:py-32">
          <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700 ring-1 ring-indigo-100">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
            L&apos;abonnement Fidély
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-balance text-gray-900 sm:text-5xl">
            Votre carte de fidélité{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              digitale
            </span>
            , sans effort
          </h1>
          <p className="mt-6 text-lg text-gray-600">
            Dès 30€/mois, 1er mois offert — la solution de fidélisation la plus accessible du
            marché.
          </p>
          <div className="mt-10">
            <Link
              href="/signup"
              className="inline-block rounded-full bg-indigo-600 px-8 py-3.5 font-medium text-white shadow-lg shadow-indigo-600/25 transition hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-xl hover:shadow-indigo-600/30"
            >
              Commencer maintenant
            </Link>
          </div>
        </div>
      </section>

      <Reveal>
        <section className="mx-auto max-w-4xl px-6 py-16">
          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-xl shadow-gray-900/5 sm:p-12">
            <div className="text-center">
              <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
                Tarification
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">
                Un prix simple, transparent, qui suit votre activité
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-gray-600">
                <span className="font-semibold text-gray-900">0,10€ par client actif scanné</span>
                , avec un minimum de facturation de{" "}
                <span className="font-semibold text-gray-900">30€/mois</span>.
              </p>
              <p className="mx-auto mt-3 max-w-xl text-sm text-gray-500">
                Concrètement : jusqu&apos;à 300 clients actifs dans le mois, vous payez 30€ (le
                minimum). Au-delà de 300 clients, vous payez 0,10€ par client supplémentaire.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {SIMULATOR.map(({ clients, price }, i) => (
                <Reveal key={clients} delay={i * 100}>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center transition hover:-translate-y-0.5 hover:shadow-md">
                    <p className="text-sm text-gray-500">{clients}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{price}</p>
                    <p className="mt-1 text-xs text-gray-400">/ mois</p>
                  </div>
                </Reveal>
              ))}
            </div>

            <div className="mt-10 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-center sm:p-8">
              <p className="text-lg font-medium text-balance text-white">
                &ldquo;Plus vous fidélisez de clients, plus vous en tirez de valeur — le prix suit
                votre succès, jamais l&apos;inverse d&apos;un abonnement fixe qui ne profite pas de
                votre croissance.&rdquo;
              </p>
            </div>

            <p className="mt-8 text-center text-sm font-medium text-gray-700">
              1er mois offert · Sans engagement
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Tout ce qui est inclus
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-gray-600">
              Une seule offre, tout inclus — pas de paliers, pas de fonctionnalités cachées
              derrière un plan supérieur.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {INCLUDED.map(({ icon, title, description }, i) => (
              <Reveal key={title} delay={(i % 3) * 100}>
                <div className="h-full rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-xl">
                    {icon}
                  </span>
                  <h3 className="mt-4 font-semibold text-gray-900">{title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="mx-auto max-w-4xl px-6 py-16">
          <div className="rounded-3xl bg-gray-950 p-8 sm:p-12">
            <h2 className="text-center text-3xl font-bold tracking-tight text-white">
              Pourquoi Fidély plutôt qu&apos;un concurrent ?
            </h2>
            <ul className="mt-10 space-y-4">
              {WHY_FIDELY.map((reason, i) => (
                <Reveal key={reason} delay={i * 80}>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-400/20 text-teal-300">
                      ✓
                    </span>
                    <span className="text-gray-200">{reason}</span>
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-balance text-gray-900 sm:text-4xl">
            Prêt à fidéliser vos clients sans vous ruiner ?
          </h2>
          <div className="mt-8">
            <Link
              href="/signup"
              className="inline-block rounded-full bg-indigo-600 px-8 py-3.5 font-medium text-white shadow-lg shadow-indigo-600/25 transition hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-xl hover:shadow-indigo-600/30"
            >
              Créer mon compte commerçant
            </Link>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
