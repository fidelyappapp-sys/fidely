"use client";

import { useActionState, useState } from "react";
import { updateCardCustomization, type CardCustomizationState } from "@/lib/actions/cardCustomization";
import { StampIcon, STAMP_STYLES } from "@/components/StampIcon";
import type { StampStyle } from "@/lib/supabase/types";

const COLOR_PRESETS = [
  "#111827",
  "#4f46e5",
  "#0891b2",
  "#059669",
  "#d97706",
  "#dc2626",
  "#db2777",
  "#7c3aed",
];

const MAX_PREVIEW_STAMPS = 40;

const initialState: CardCustomizationState = {};

export function CardCustomizer({
  businessName,
  rewardThreshold,
  initialColor,
  initialStampStyle,
}: {
  businessName: string;
  rewardThreshold: number;
  initialColor: string;
  initialStampStyle: StampStyle;
}) {
  const [state, formAction, pending] = useActionState(updateCardCustomization, initialState);
  const [color, setColor] = useState(initialColor);
  const [stampStyle, setStampStyle] = useState<StampStyle>(initialStampStyle);

  const stampCount = Math.min(rewardThreshold, MAX_PREVIEW_STAMPS);
  const previewFilled = Math.max(1, Math.round(stampCount * 0.4));

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <form action={formAction} className="space-y-6">
        <input type="hidden" name="brandColor" value={color} />
        <input type="hidden" name="stampStyle" value={stampStyle} />

        <div>
          <p className="text-sm font-medium text-gray-700">Couleur de la carte</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setColor(preset)}
                aria-label={preset}
                className={`h-8 w-8 rounded-full ring-2 ring-offset-2 transition ${
                  color.toLowerCase() === preset ? "ring-gray-900" : "ring-transparent"
                }`}
                style={{ backgroundColor: preset }}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              className="h-8 w-10 cursor-pointer rounded border border-gray-300"
              aria-label="Couleur personnalisée"
            />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700">Style des tampons de points</p>
          <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-7">
            {STAMP_STYLES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setStampStyle(s.value)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs transition ${
                  stampStyle === s.value
                    ? "border-gray-900 bg-gray-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <StampIcon style={s.value} filled className="h-5 w-5 text-gray-900" />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state.success && <p className="text-sm text-green-600">Carte mise à jour.</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {pending ? "Enregistrement..." : "Enregistrer la carte"}
        </button>
      </form>

      <div className="flex justify-center lg:justify-end lg:pt-7">
        <div
          className="relative w-72 overflow-hidden rounded-[22px] p-5 text-white shadow-2xl ring-1 ring-white/10"
          style={{ backgroundColor: color }}
        >
          <span
            aria-hidden
            className="animate-sheen pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium tracking-wide text-white/70 uppercase">
              Carte de fidélité
            </span>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-bold">
              {businessName[0]?.toUpperCase() ?? "F"}
            </span>
          </div>
          <p className="mt-4 truncate text-lg font-semibold">{businessName}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {Array.from({ length: stampCount }).map((_, i) => (
              <StampIcon
                key={i}
                style={stampStyle}
                filled={i < previewFilled}
                className={`h-5 w-5 ${i < previewFilled ? "text-white" : "text-white/30"}`}
              />
            ))}
          </div>
          <p className="mt-4 text-xs text-white/70">
            Aperçu — {previewFilled}/{stampCount} points
            {rewardThreshold > MAX_PREVIEW_STAMPS ? "+" : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
