import { QrGlyph } from "./QrGlyph";

export function WalletCard({
  business = "Le Café des Arts",
  points = 140,
  className = "",
  animated = true,
  variant = "apple",
}: {
  business?: string;
  points?: number;
  className?: string;
  animated?: boolean;
  variant?: "apple" | "google";
}) {
  if (variant === "google") {
    return (
      <div
        className={`relative w-72 overflow-hidden rounded-[22px] bg-white p-5 text-gray-900 shadow-2xl shadow-gray-900/10 ring-1 ring-gray-100 ${className}`}
      >
        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-emerald-500 to-teal-500" />
        <div className="flex items-center justify-between pl-2">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-sm font-bold text-emerald-700">
              F
            </span>
            <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">
              Carte de fidélité
            </span>
          </div>
          <span className="text-[10px] font-medium tracking-wide text-gray-400 uppercase">
            Google Wallet
          </span>
        </div>

        <p className="mt-5 pl-2 text-sm text-gray-500">{business}</p>
        <div className="mt-1 flex items-baseline gap-1.5 pl-2">
          <span className="text-4xl font-bold tabular-nums">{points}</span>
          <span className="text-sm text-gray-500">points</span>
        </div>

        <div className="mt-5 flex items-end justify-between pl-2">
          <div className="flex h-8 flex-1 items-center gap-[2px]">
            {Array.from({ length: 28 }).map((_, i) => (
              <span
                key={i}
                className="bg-gray-800"
                style={{ width: 2, height: i % 5 === 0 ? "100%" : "60%" }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative w-72 overflow-hidden rounded-[22px] bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-5 text-white shadow-2xl shadow-indigo-950/40 ring-1 ring-white/10 ${className}`}
    >
      {animated && (
        <span className="animate-sheen pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-sm font-bold">
            F
          </span>
          <span className="text-xs font-medium tracking-wide text-white/70 uppercase">
            Carte de fidélité
          </span>
        </div>
        <span className="text-[10px] font-medium tracking-wide text-white/50 uppercase">
          Apple Wallet
        </span>
      </div>

      <p className="mt-5 text-sm text-white/70">{business}</p>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-4xl font-bold tabular-nums">{points}</span>
        <span className="text-sm text-white/70">points</span>
      </div>

      <div className="mt-5 flex items-end justify-between">
        <div className="h-8 w-28 rounded-md bg-white/10" />
        <QrGlyph className="h-14 w-14 shrink-0" />
      </div>
    </div>
  );
}
