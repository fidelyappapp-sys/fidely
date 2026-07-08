import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">
        Une offre simple, tout inclus
      </h1>
      <p className="mt-4 text-gray-600">
        Pas de paliers, pas de fonctionnalités réservées à un plan supérieur. Vous payez
        uniquement pour l&apos;usage réel de vos clients.
      </p>

      <div className="mt-10 rounded-3xl border border-indigo-100 bg-indigo-50/40 p-8">
        <p className="text-sm font-medium text-indigo-700">Offre unique</p>
        <p className="mt-2 text-4xl font-bold text-gray-900">
          0,10€ <span className="text-lg font-normal text-gray-500">/ scan</span>
        </p>
        <p className="mt-1 text-sm text-gray-500">Minimum 30€ / mois</p>

        <ul className="mt-8 space-y-3 text-sm">
          {[
            "Inscription commerçant et programme de fidélité personnalisable",
            "Génération automatique des QR codes clients",
            "Carte de fidélité dans Apple Wallet et Google Wallet",
            "Scanner de points intégré, utilisable depuis n'importe quel navigateur",
            "Mise à jour automatique du pass et notification au client à chaque scan",
            "Facturation et paiement automatiques via Stripe",
          ].map((item) => (
            <li key={item} className="flex gap-3">
              <span aria-hidden className="text-indigo-600">
                ✓
              </span>
              <span className="text-gray-700">{item}</span>
            </li>
          ))}
        </ul>

        <Link
          href="/signup"
          className="mt-10 block rounded-full bg-indigo-600 px-6 py-3 text-center font-medium text-white hover:bg-indigo-500"
        >
          Créer mon compte
        </Link>
      </div>

      <p className="mt-6 text-xs text-gray-500">
        Exemple : en dessous de 300 scans sur le mois, vous payez le minimum de 30€. Au-delà, vous
        payez 0,10€ par scan supplémentaire (soit exactement 0,10€ × nombre de scans dès que ce
        montant dépasse 30€).
      </p>
    </div>
  );
}
