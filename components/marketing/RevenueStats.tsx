const stats = [
  {
    value: "+25 à 95%",
    label: "de profits en plus",
    description:
      "en augmentant de seulement 5% la fidélisation client (Bain & Company / Harvard Business Review).",
  },
  {
    value: "+67%",
    label: "de dépenses en moyenne",
    description: "un client fidèle dépense significativement plus qu'un nouveau client.",
  },
  {
    value: "x5 à x25",
    label: "moins cher",
    description: "fidéliser un client coûte bien moins cher que d'en acquérir un nouveau.",
  },
];

export function RevenueStats() {
  return (
    <section className="bg-indigo-950 py-20 text-white">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <p className="text-sm font-medium tracking-wide text-indigo-300 uppercase">
            Pourquoi la fidélité paie
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Une carte de fidélité augmente durablement votre chiffre d&apos;affaires
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-indigo-200">
            Faire revenir vos clients coûte moins cher que d&apos;en attirer de nouveaux — et
            c&apos;est exactement ce que Fidély automatise pour vous, scan après scan.
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-4xl font-bold text-amber-400">{stat.value}</p>
              <p className="mt-1 font-semibold">{stat.label}</p>
              <p className="mt-2 text-sm text-indigo-200">{stat.description}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-indigo-300">
          Chiffres couramment cités dans les études sur la fidélisation client — donnés à titre
          indicatif.
        </p>
      </div>
    </section>
  );
}
