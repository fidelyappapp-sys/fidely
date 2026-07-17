import { QrGlyph } from "./QrGlyph";
import { WalletCard } from "./WalletCard";

export function WalletShowcase() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold tracking-wide text-indigo-600 uppercase">
          En situation réelle
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Une carte qui vit dans la poche de vos clients
        </h2>
        <p className="mt-4 text-gray-600">
          Aucune application à installer. La carte s&apos;ajoute au Wallet natif du téléphone et
          le QR code s&apos;affiche même hors connexion.
        </p>
      </div>

      <div className="mt-16 grid gap-6 lg:grid-cols-5">
        <div className="relative flex items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-gray-50 to-indigo-50/60 p-10 ring-1 ring-gray-100 lg:col-span-3">
          <div className="relative h-72 w-full max-w-sm">
            <WalletCard
              variant="apple"
              points={140}
              className="absolute top-0 left-1/2 -translate-x-[58%] -rotate-6"
            />
            <WalletCard
              variant="google"
              business="Salon Karim Coiffure"
              points={60}
              animated={false}
              className="absolute top-6 left-1/2 -translate-x-[42%] rotate-6"
            />
          </div>
        </div>

        <div className="flex flex-col justify-between gap-6 rounded-3xl bg-gray-950 p-8 text-white lg:col-span-2">
          <div>
            <p className="text-sm font-medium tracking-wide text-indigo-300 uppercase">
              Au comptoir
            </p>
            <p className="mt-3 text-lg font-semibold">Scanné en moins d&apos;une seconde</p>
            <p className="mt-2 text-sm text-white/60">
              Le QR code du client s&apos;affiche sur l&apos;écran verrouillé — votre équipe le
              scanne depuis n&apos;importe quel navigateur, sans terminal dédié.
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <div className="relative shrink-0">
              <span className="animate-pulse-ring absolute inset-0 rounded-lg bg-indigo-400/50" />
              <QrGlyph className="relative h-16 w-16" />
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Scan validé
              </p>
              <p className="mt-1 text-xs text-white/60">+10 points · solde 140</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
