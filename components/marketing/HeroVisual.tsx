import Image from "next/image";
import { QrGlyph } from "./QrGlyph";
import { heroImageExists, HERO_IMAGE_PATH } from "@/lib/heroImage";

function HeroFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-hero-rise relative">
      <div
        aria-hidden
        className="animate-drift pointer-events-none absolute -top-10 -left-14 h-64 w-64 rounded-full bg-teal-400/20 blur-3xl"
      />
      <div
        aria-hidden
        className="animate-drift pointer-events-none absolute -right-10 -bottom-10 h-72 w-72 rounded-full bg-amber-400/15 blur-3xl"
        style={{ animationDelay: "-6s" }}
      />

      <div className="animate-float-y relative aspect-[3/4] w-[300px] -rotate-2 overflow-hidden rounded-[2rem] shadow-2xl shadow-gray-950/40 ring-1 ring-white/10 transition-transform duration-700 hover:rotate-0 sm:w-[340px]">
        {children}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10"
        />
      </div>

      <div className="absolute top-6 -right-6 hidden items-center gap-1.5 rounded-2xl bg-white px-3 py-2 shadow-xl ring-1 ring-gray-100 sm:flex">
        <span className="text-amber-400">★★★★★</span>
        <span className="text-xs font-semibold text-gray-700">4.9 avis Google</span>
      </div>

      <div className="absolute -bottom-6 -left-8 hidden rounded-2xl bg-white p-3 shadow-xl ring-1 ring-gray-100 sm:block">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          + 10 points ajoutés
        </p>
      </div>
    </div>
  );
}

// Crafted stand-in for the real photo (a Fidély display stand on a bar
// counter): a dim bar backdrop with a mocked acrylic poster card, so the
// hero still reads as intentional/premium before the real asset is dropped
// into public/hero-presentoir.jpg.
function HeroPlaceholderScene() {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-950 to-black">
      <div className="absolute inset-x-0 top-0 flex h-2/5 items-end justify-center gap-3 opacity-40">
        {[40, 65, 50, 75, 45, 60].map((h, i) => (
          <div
            key={i}
            className="w-4 rounded-t-full bg-gradient-to-b from-teal-400/60 to-amber-500/40 blur-[1px]"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>

      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black via-black/80 to-transparent"
      />

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[62%] overflow-hidden rounded-xl bg-gray-950 p-4 text-center shadow-2xl ring-1 ring-white/10">
          <div className="mx-auto flex items-center justify-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-400/20 text-[10px] text-teal-300">
              ♥
            </span>
            <span className="text-sm font-bold text-white">fidely</span>
          </div>
          <p className="mt-3 text-[10px] leading-snug text-white/70">
            Ajoutez notre carte de fidélité
            <br />à votre wallet
          </p>
          <div className="mx-auto mt-3 flex w-fit items-center justify-center rounded-lg bg-white p-2">
            <QrGlyph className="h-12 w-12" />
          </div>
          <div className="mx-auto mt-3 h-1.5 w-16 rounded-full bg-teal-400/70" />
        </div>
      </div>
    </div>
  );
}

export function HeroVisual() {
  if (heroImageExists()) {
    return (
      <HeroFrame>
        <Image
          src={HERO_IMAGE_PATH}
          alt="Présentoir Fidély posé sur le comptoir d'un bar, un client ajoute la carte de fidélité à son wallet"
          fill
          priority
          sizes="(min-width: 640px) 340px, 300px"
          className="object-cover"
        />
      </HeroFrame>
    );
  }

  return (
    <HeroFrame>
      <HeroPlaceholderScene />
    </HeroFrame>
  );
}
