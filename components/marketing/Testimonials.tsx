// Placeholder testimonials for the demo/marketing site — swap for real
// merchant quotes before launch.
const testimonials = [
  {
    name: "Camille Roussel",
    business: "Le Café des Arts",
    initials: "CR",
    quote:
      "Depuis qu'on a mis en place Fidély, nos habitués reviennent clairement plus souvent. Le scan est instantané et les clients adorent voir leurs points se mettre à jour direct sur leur téléphone.",
  },
  {
    name: "Karim Belaïd",
    business: "Salon Karim Coiffure",
    initials: "KB",
    quote:
      "On a testé plusieurs solutions de fidélité avant, toutes trop compliquées à installer. Là, les clients ajoutent leur carte à leur Wallet en un tap et on n'a plus jamais de tampons perdus.",
  },
  {
    name: "Léa Fontaine",
    business: "Boutique Fontaine",
    initials: "LF",
    quote:
      "La facturation au scan nous convient parfaitement : on paie exactement ce qu'on utilise, sans mauvaise surprise. Et on a vu le panier moyen des clients fidélisés augmenter sensiblement.",
  },
];

function Stars() {
  return (
    <div aria-hidden className="flex gap-0.5 text-amber-400">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i}>★</span>
      ))}
    </div>
  );
}

export function Testimonials() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      <div className="text-center">
        <p className="text-sm font-medium tracking-wide text-indigo-600 uppercase">
          Ils utilisent Fidély
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Des commerçants qui voient déjà la différence
        </h2>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {testimonials.map((t) => (
          <figure
            key={t.name}
            className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <Stars />
            <blockquote className="mt-4 flex-1 text-sm text-gray-600">
              &ldquo;{t.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                {t.initials}
              </span>
              <span>
                <span className="block text-sm font-semibold text-gray-900">{t.name}</span>
                <span className="block text-xs text-gray-500">{t.business}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
