import Image from "next/image";
import Link from "next/link";
import { PublicNfcOrderForm } from "@/components/marketing/PublicNfcOrderForm";
import { PLAQUE_TIER_BASE_PRICE_CENTS, PLAQUE_TIER_LABELS, PLAQUE_PRO_SUBSCRIPTION_CENTS } from "@/lib/boutique";

const PACK_CONTENT = [
  "1 plaque NFC + QR code",
  "Adhésif puissant",
  "Design professionnel",
  "Résistant et durable",
  "Prête à l'emploi",
];

const HIGHLIGHTS = [
  {
    icon: "★",
    title: "Plus d'avis 5 étoiles",
    description: "Facilitez l'accès à votre page Google et obtenez plus d'avis positifs en quelques secondes.",
  },
  {
    icon: "◉",
    title: "Technologie NFC intégrée",
    description: "Vos clients n'ont qu'à poser leur téléphone, sans application, en un instant.",
  },
  {
    icon: "▦",
    title: "QR code universel",
    description: "Compatible avec tous les smartphones. Scannez et donnez votre avis facilement.",
  },
  {
    icon: "✓",
    title: "Simple, rapide et efficace",
    description: "Design professionnel, installation facile, résultat immédiat.",
  },
];

function formatEuros(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",") + "€";
}

export default function AvisGooglePage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      <div className="text-center">
        <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
          Plaque avis Google
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Plus d&apos;avis 5 étoiles, sans lever le petit doigt
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-gray-600">
          Une plaque NFC et QR code prête à poser sur votre comptoir pour récolter plus d&apos;avis
          Google, sans effort pour vos clients.
        </p>
      </div>

      <div className="mt-14 grid gap-10 lg:grid-cols-2 lg:items-center">
        <div className="relative mx-auto aspect-[1290/1934] w-full max-w-md overflow-hidden rounded-3xl shadow-xl ring-1 ring-gray-100">
          <Image
            src="/avis-google-flyer.jpg"
            alt="Plaque Fidély avec QR code et puce NFC : Laissez-nous un avis sur Internet"
            fill
            sizes="(min-width: 1024px) 448px, 100vw"
            className="object-cover"
            priority
          />
        </div>

        <div>
          <ul className="space-y-5">
            {HIGHLIGHTS.map((point) => (
              <li key={point.title} className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-lg text-indigo-600">
                  {point.icon}
                </span>
                <div>
                  <p className="font-semibold text-gray-900">{point.title}</p>
                  <p className="mt-1 text-sm text-gray-600">{point.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-16 mx-auto max-w-md">
        <div className="rounded-3xl border border-gray-100 p-8">
          <h2 className="font-semibold text-gray-900">Contenu du pack</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {PACK_CONTENT.map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-gray-700">
                <span className="text-indigo-600">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-16">
        <h2 className="text-center text-2xl font-bold text-gray-900">Choisissez votre palier</h2>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="flex flex-col rounded-3xl border border-gray-100 p-6">
            <p className="font-semibold text-gray-900">{PLAQUE_TIER_LABELS.avis}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{formatEuros(PLAQUE_TIER_BASE_PRICE_CENTS.avis)}</p>
            <p className="mt-1 text-xs text-gray-500">Paiement unique, dégressif selon la quantité</p>
            <p className="mt-3 text-sm text-gray-600">
              Redirection directe vers votre lien d&apos;avis Google. Aucun compte requis, aucune page
              intermédiaire.
            </p>
            <div className="mt-6">
              <PublicNfcOrderForm />
            </div>
          </div>

          <div className="flex flex-col rounded-3xl border border-gray-100 p-6">
            <p className="font-semibold text-gray-900">{PLAQUE_TIER_LABELS.presence}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{formatEuros(PLAQUE_TIER_BASE_PRICE_CENTS.presence)}</p>
            <p className="mt-1 text-xs text-gray-500">Paiement unique, dégressif selon la quantité</p>
            <p className="mt-3 text-sm text-gray-600">
              Une page Hub avec plusieurs onglets (menu, réseaux sociaux, avis, contact) — 3 modifications par
              mois incluses. Nécessite un compte commerçant.
            </p>
            <Link
              href="/signup"
              className="mt-auto block rounded-full bg-gray-900 px-6 py-3 text-center font-medium text-white hover:bg-gray-700"
            >
              Créez votre compte pour commander
            </Link>
          </div>

          <div className="flex flex-col rounded-3xl border-2 border-indigo-600 p-6">
            <p className="font-semibold text-gray-900">{PLAQUE_TIER_LABELS.pro}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {formatEuros(PLAQUE_TIER_BASE_PRICE_CENTS.pro)} + {formatEuros(PLAQUE_PRO_SUBSCRIPTION_CENTS.month)}/mois
            </p>
            <p className="mt-1 text-xs text-gray-500">
              ou {formatEuros(PLAQUE_PRO_SUBSCRIPTION_CENTS.year)}/an — prix fixe par commerce
            </p>
            <p className="mt-3 text-sm text-gray-600">
              Modifications illimitées, menu multilingue traduit automatiquement, tous les onglets. Nécessite un
              compte commerçant.
            </p>
            <Link
              href="/signup"
              className="mt-auto block rounded-full bg-indigo-600 px-6 py-3 text-center font-medium text-white hover:bg-indigo-500"
            >
              Créez votre compte pour commander
            </Link>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-gray-400">
          Le tarif dégressif s&apos;applique au prix de la plaque, cumulé à vie sur l&apos;ensemble de vos
          commandes — indépendamment du prix de l&apos;abonnement Pro, fixe quel que soit le nombre de plaques.
        </p>
      </div>

      <p className="mt-10 text-center text-sm text-gray-500">
        Vous cherchez plutôt une carte de fidélité digitale pour vos clients ?{" "}
        <Link href="/pricing" className="font-medium text-indigo-600 hover:text-indigo-500">
          Voir nos tarifs
        </Link>
      </p>
    </div>
  );
}
