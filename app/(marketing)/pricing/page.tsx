import Link from "next/link";

const FEATURES: { icon: string; text: string }[] = [
  { icon: "📝", text: "Inscription commerçant et programme de fidélité personnalisable" },
  { icon: "🔗", text: "Génération automatique des QR codes clients" },
  { icon: "📱", text: "Carte de fidélité dans Apple Wallet et Google Wallet" },
  { icon: "📷", text: "Scanner de points intégré, utilisable depuis n'importe quel navigateur" },
  { icon: "🔔", text: "Mise à jour automatique du pass et notification au client à chaque scan" },
  { icon: "💳", text: "Facturation et paiement automatiques via Stripe" },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <div className="text-center">
        <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
          Sans engagement
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">
          Une offre simple, tout inclus
        </h1>
        <p className="mt-4 text-gray-600">
          Pas de paliers, pas de fonctionnalités réservées à un plan supérieur. Vous payez
          uniquement pour l&apos;usage réel de vos clients.
        </p>
      </div>

      <div className="relative mt-10 rounded-3xl border-2 border-indigo-500 bg-white p-8 shadow-xl shadow-indigo-100">
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-xs font-semibold tracking-wide text-white uppercase shadow-sm">
          Offre recommandée
        </span>

        <p className="text-sm font-medium text-indigo-700">Offre unique</p>
        <p className="mt-2 text-4xl font-bold text-gray-900">
          0,10€ <span className="text-lg font-normal text-gray-500">/ scan</span>
        </p>
        <p className="mt-1 text-sm text-gray-500">Minimum 30€ / mois</p>

        <ul className="mt-8 space-y-3.5 text-sm">
          {FEATURES.map(({ icon, text }) => (
            <li key={text} className="flex items-center gap-3">
              <span
                aria-hidden
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-base"
              >
                {icon}
              </span>
              <span className="text-gray-700">{text}</span>
            </li>
          ))}
        </ul>

        <Link
          href="/signup"
          className="mt-10 block rounded-full bg-indigo-600 px-6 py-3 text-center font-medium text-white transition hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-lg"
        >
          Créer mon compte
        </Link>
      </div>

      <p className="mt-6 text-center text-xs text-gray-500">
        Exemple : en dessous de 300 scans sur le mois, vous payez le minimum de 30€. Au-delà, vous
        payez 0,10€ par scan supplémentaire (soit exactement 0,10€ × nombre de scans dès que ce
        montant dépasse 30€).
      </p>
    </div>
  );
}
