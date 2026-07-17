import { WalletCard } from "./WalletCard";

const cards: { business: string; points: number; variant: "apple" | "google" }[] = [
  { business: "Le Café des Arts", points: 140, variant: "apple" },
  { business: "Salon Karim Coiffure", points: 60, variant: "google" },
  { business: "Boulangerie Martin", points: 220, variant: "apple" },
  { business: "Pizzeria Bella Notte", points: 90, variant: "google" },
  { business: "Fleuriste Les Pétales", points: 175, variant: "apple" },
  { business: "Institut Beauté Lily", points: 45, variant: "google" },
];

export function CardsCarousel() {
  const track = [...cards, ...cards];

  return (
    <section className="overflow-hidden py-16">
      <div className="mx-auto mb-10 max-w-2xl px-6 text-center">
        <p className="text-sm font-semibold tracking-wide text-indigo-600 uppercase">
          Déjà adopté
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Des cartes pour tous les commerces
        </h2>
      </div>

      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-white to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-white to-transparent"
        />

        <div className="animate-marquee hover:[animation-play-state:paused] flex w-fit gap-6">
          {track.map((card, i) => (
            <WalletCard
              key={`${card.business}-${i}`}
              business={card.business}
              points={card.points}
              variant={card.variant}
              className="w-64 shrink-0 scale-90"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
