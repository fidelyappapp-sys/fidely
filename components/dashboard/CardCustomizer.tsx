"use client";

import { useActionState, useRef, useState } from "react";
import { updateCardCustomization, type CardCustomizationState } from "@/lib/actions/cardCustomization";
import { StampIcon, STAMP_STYLES } from "@/components/StampIcon";
import { SectorIcon, SECTORS } from "@/components/SectorIcon";
import { ColorPicker } from "@/components/dashboard/ColorPicker";
import { suggestTextColor } from "@/lib/color";
import type { StampIconKey, SectorKey } from "@/lib/supabase/types";

const initialState: CardCustomizationState = {};

// Fictional customer shown in the live preview so the merchant can see
// exactly what a real customer's card looks like, matching the bottom info
// row already rendered on the public card (app/(public-card)/c/[publicId]).
const PREVIEW_CUSTOMER = {
  name: "Jean Dupont",
  phone: "06 12 34 56 78",
  memberSince: new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }),
};

export function CardCustomizer({
  businessName,
  displayMode,
  stampCount,
  initialColor,
  initialTextColor,
  initialStampStyle,
  initialSector,
  initialLogoUrl,
  initialBackgroundPhotoUrl,
  initialBackgroundPhotoEnabled,
  initialNameDisplayMode,
}: {
  businessName: string;
  displayMode: "stamps" | "points";
  stampCount: number;
  initialColor: string;
  // Null until a merchant explicitly picks one — the picker then starts
  // from a luminance-based suggestion instead (see suggestTextColor).
  initialTextColor: string | null;
  initialStampStyle: StampIconKey;
  initialSector: SectorKey | null;
  initialLogoUrl: string | null;
  initialBackgroundPhotoUrl: string | null;
  initialBackgroundPhotoEnabled: boolean;
  initialNameDisplayMode: "text" | "logo";
}) {
  const [state, formAction, pending] = useActionState(updateCardCustomization, initialState);
  const [color, setColor] = useState(initialColor);
  const [textColor, setTextColor] = useState(initialTextColor ?? suggestTextColor(initialColor));
  const [stampStyle, setStampStyle] = useState<StampIconKey>(initialStampStyle);
  const [sector, setSector] = useState<SectorKey | "">(initialSector ?? "");
  const [logoPreview, setLogoPreview] = useState<string | null>(initialLogoUrl);
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(initialBackgroundPhotoUrl);
  const [backgroundEnabled, setBackgroundEnabled] = useState(initialBackgroundPhotoEnabled);
  const [nameDisplayMode, setNameDisplayMode] = useState<"text" | "logo">(initialNameDisplayMode);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);

  const showLogoOnCard = nameDisplayMode === "logo" && Boolean(logoPreview);
  const previewFilled = Math.max(1, Math.round(stampCount * 0.4));
  const showPhotoBanner = backgroundEnabled && Boolean(backgroundPreview);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <form action={formAction} className="space-y-6">
        <input type="hidden" name="brandColor" value={color} />
        <input type="hidden" name="textColor" value={textColor} />
        <input type="hidden" name="stampStyle" value={stampStyle} />
        <input type="hidden" name="sector" value={sector} />
        <input type="hidden" name="backgroundPhotoEnabled" value={backgroundEnabled ? "true" : "false"} />
        <input type="hidden" name="nameDisplayMode" value={nameDisplayMode} />

        <div>
          <p className="text-sm font-medium text-gray-700">Couleur de la carte</p>
          <div className="mt-2">
            <ColorPicker value={color} onChange={setColor} />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700">Couleur du texte</p>
          <p className="mt-0.5 text-xs text-gray-500">
            Nom, libellés et chiffres affichés sur la carte — choisissez-la clair sur fond sombre, ou
            sombre sur fond clair/photo pour rester lisible.
          </p>
          <div className="mt-2">
            <ColorPicker value={textColor} onChange={setTextColor} />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700">Nom / Logo</p>
          <p className="mt-0.5 text-xs text-gray-500">
            Ce qui s&apos;affiche en évidence sur la carte : le nom du commerce, ou votre logo.
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setNameDisplayMode("text")}
              className={`rounded-xl border p-3 text-left text-sm transition ${
                nameDisplayMode === "text" ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <p className="font-medium text-gray-900">Texte</p>
              <p className="mt-0.5 text-xs text-gray-500">Nom du commerce affiché en toutes lettres.</p>
            </button>
            <button
              type="button"
              onClick={() => setNameDisplayMode("logo")}
              className={`rounded-xl border p-3 text-left text-sm transition ${
                nameDisplayMode === "logo" ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <p className="font-medium text-gray-900">Logo</p>
              <p className="mt-0.5 text-xs text-gray-500">Votre logo remplace le texte.</p>
            </button>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
              ) : sector ? (
                <SectorIcon sector={sector} className="h-7 w-7 text-gray-400" />
              ) : (
                <span className="text-lg font-bold text-gray-400">{businessName[0]?.toUpperCase() ?? "F"}</span>
              )}
            </div>
            <input
              ref={logoInputRef}
              type="file"
              name="logo"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) setLogoPreview(URL.createObjectURL(file));
              }}
            />
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="rounded-full border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:border-gray-400"
            >
              {logoPreview ? "Changer le logo" : "Ajouter un logo"}
            </button>
          </div>
          {nameDisplayMode === "logo" && !logoPreview && (
            <p className="mt-2 text-xs text-amber-600">
              Ajoutez un logo pour qu&apos;il remplace le texte — en attendant, le nom du commerce reste affiché.
            </p>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700">Style des tampons de points</p>
          <p className="mt-0.5 text-xs text-gray-500">
            Choisissez n&apos;importe quelle icône ci-dessous — secteur ou forme générique — comme style
            de tampon. La même icône de secteur sert aussi d&apos;icône par défaut tant que vous
            n&apos;avez pas de logo.
          </p>
          <div className="mt-2 grid grid-cols-5 gap-2">
            {SECTORS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => {
                  setSector(s.value);
                  setStampStyle(s.value);
                }}
                title={s.label}
                className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-[10px] transition ${
                  stampStyle === s.value ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <SectorIcon sector={s.value} className="h-4 w-4 text-gray-900" />
                <span className="truncate">{s.label}</span>
              </button>
            ))}
          </div>
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

        <div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">Photo en bandeau</p>
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={backgroundEnabled}
                onChange={(event) => setBackgroundEnabled(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              Utiliser une photo
            </label>
          </div>
          {backgroundEnabled && (
            <div className="mt-2 flex items-center gap-3">
              <div className="h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                {backgroundPreview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={backgroundPreview} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <input
                ref={backgroundInputRef}
                type="file"
                name="backgroundPhoto"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) setBackgroundPreview(URL.createObjectURL(file));
                }}
              />
              <button
                type="button"
                onClick={() => backgroundInputRef.current?.click()}
                className="rounded-full border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:border-gray-400"
              >
                {backgroundPreview ? "Changer la photo" : "Ajouter une photo"}
              </button>
            </div>
          )}
          {backgroundEnabled ? (
            <p className="mt-1 text-xs text-gray-500">
              La photo occupe uniquement le bandeau du haut de la carte — le reste garde votre couleur de
              fond.
            </p>
          ) : (
            <p className="mt-1 text-xs text-gray-500">
              Désactivé — la carte utilise la couleur unie ci-dessus.
            </p>
          )}
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
          className="relative w-72 overflow-hidden rounded-[22px] p-5 shadow-2xl ring-1 ring-white/10"
          style={{ backgroundColor: color, color: textColor }}
        >
          {showPhotoBanner && (
            <div aria-hidden className="absolute inset-x-0 top-0 h-32 overflow-hidden">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${backgroundPreview})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <div
                className="absolute inset-x-0 bottom-0 h-10"
                style={{ background: `linear-gradient(to bottom, transparent, ${color})` }}
              />
            </div>
          )}
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium tracking-wide uppercase opacity-70">
                Carte de fidélité
              </span>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/15 text-sm font-bold text-white">
                {logoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoPreview} alt="" className="h-full w-full object-cover" />
                ) : sector ? (
                  <SectorIcon sector={sector} className="h-4 w-4" />
                ) : (
                  businessName[0]?.toUpperCase() ?? "F"
                )}
              </span>
            </div>
            {showLogoOnCard ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoPreview!} alt={businessName} className="mt-4 h-10 max-w-[70%] object-contain" />
            ) : (
              <p className="mt-4 truncate font-serif text-lg font-semibold">{businessName}</p>
            )}

            {displayMode === "stamps" ? (
              <>
                <div className="mt-5 grid w-fit grid-cols-5 gap-2">
                  {Array.from({ length: stampCount }).map((_, i) => (
                    <StampIcon
                      key={i}
                      style={stampStyle}
                      filled={i < previewFilled}
                      className={`h-5 w-5 transition-opacity ${i < previewFilled ? "opacity-100" : "opacity-30"}`}
                    />
                  ))}
                </div>
                <p className="mt-4 text-xs opacity-70">
                  Aperçu — {previewFilled}/{stampCount} tampons
                </p>
              </>
            ) : (
              <>
                <p className="mt-5 text-3xl font-bold">120</p>
                <div className="mt-3 h-2 rounded-full bg-white/20">
                  <div className="h-2 w-2/5 rounded-full bg-white" />
                </div>
                <p className="mt-2 text-xs opacity-70">Aperçu — points cumulés</p>
              </>
            )}

            <div className="mt-5 flex items-end justify-between border-t border-white/10 pt-3">
              <div>
                <p className="text-[10px] tracking-wide uppercase opacity-60">Téléphone</p>
                <p className="text-xs font-medium">{PREVIEW_CUSTOMER.phone}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] tracking-wide uppercase opacity-60">Client</p>
                <p className="font-serif text-xs font-medium">{PREVIEW_CUSTOMER.name}</p>
              </div>
            </div>
            <p className="mt-2 text-[10px] opacity-50">Membre depuis {PREVIEW_CUSTOMER.memberSince}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
