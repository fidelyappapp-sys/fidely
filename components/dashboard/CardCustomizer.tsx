"use client";

import { useActionState, useRef, useState } from "react";
import { updateCardCustomization, type CardCustomizationState } from "@/lib/actions/cardCustomization";
import { StampIcon, STAMP_STYLES } from "@/components/StampIcon";
import { SectorIcon, SECTORS } from "@/components/SectorIcon";
import { ColorPicker } from "@/components/dashboard/ColorPicker";
import { QrGlyph } from "@/components/marketing/QrGlyph";
import { suggestTextColor } from "@/lib/color";
import type { StampIconKey, SectorKey } from "@/lib/supabase/types";

const initialState: CardCustomizationState = {};

export function CardCustomizer({
  businessName,
  city,
  displayMode,
  stampCount,
  rewardThreshold,
  rewardDescription,
  initialColor,
  initialTextColor,
  initialStampStyle,
  initialSector,
  initialLogoUrl,
  initialBackgroundPhotoUrl,
  initialBackgroundPhotoEnabled,
  initialNameDisplayMode,
  posId,
  action = updateCardCustomization,
  submitLabel = "Enregistrer la carte",
}: {
  businessName: string;
  // Shown in the preview's header, matching the real pass's headerFields
  // (see lib/wallet/apple/pkpass.ts) — null before a point of sale's city
  // has been set.
  city?: string | null;
  displayMode: "stamps" | "points";
  stampCount: number;
  // Shown in the preview's reward/objectif row so it matches the structure
  // of the real Apple/Google pass and the public card (CardPoints.tsx),
  // instead of the old hardcoded example with no reward shown at all.
  rewardThreshold: number;
  rewardDescription: string;
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
  // Which point of sale (merchant_qr_codes row) this edits — required by
  // updateCardCustomization to target a single point of sale's design,
  // independent from every other point of sale of the same merchant.
  posId: string;
  // Lets the onboarding wizard reuse this exact component/action and just
  // redirect to the next step on success instead of showing "Carte mise à
  // jour." inline (see lib/actions/onboarding.ts).
  action?: (state: CardCustomizationState, formData: FormData) => Promise<CardCustomizationState>;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
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

  const previewFilled = Math.max(1, Math.round(stampCount * 0.4));
  const previewPoints = Math.max(1, Math.round(rewardThreshold * 0.4));
  const rewardCaption = rewardDescription || "récompense à définir";
  const showPhotoBanner = backgroundEnabled && Boolean(backgroundPreview);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <form action={formAction} className="space-y-6">
        <input type="hidden" name="posId" value={posId} />
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
          {nameDisplayMode === "logo" && (
            <p className="mt-2 text-xs text-gray-500">
              S&apos;applique à la carte web de vos clients. Apple et Google Wallet affichent toujours le
              nom du commerce dans leur propre bandeau — aucune plateforme ne permet de le remplacer par
              un logo.
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
          {pending ? "Enregistrement..." : submitLabel}
        </button>
      </form>

      <div className="flex flex-col items-center gap-3 lg:items-end lg:pt-7">
        {/* Reproduit l'agencement réel d'un pass Apple/Google Wallet
            (headerFields/primaryFields/secondaryFields/auxiliaryFields) —
            pas une maquette libre. Voir lib/wallet/apple/pkpass.ts. */}
        <div
          className="w-72 overflow-hidden rounded-[22px] shadow-2xl ring-1 ring-white/10"
          style={{ backgroundColor: color, color: textColor }}
        >
          <div className="flex items-center justify-between gap-2 px-4 pt-4">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-8 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white/10">
                {logoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoPreview} alt="" className="h-full w-full object-contain" />
                ) : (
                  <span className="text-[10px] font-bold opacity-70">
                    {businessName.slice(0, 3).toUpperCase()}
                  </span>
                )}
              </span>
              <span className="truncate text-sm font-medium">{businessName}</span>
            </div>
            {city && <span className="shrink-0 text-xs opacity-70">{city}</span>}
          </div>

          <div className="relative mt-4">
            {showPhotoBanner && (
              <div aria-hidden className="absolute inset-0 overflow-hidden">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${backgroundPreview})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <div className="absolute inset-0 bg-black/25" />
              </div>
            )}
            <div className="relative px-4 py-6">
              <p className="text-[10px] font-medium tracking-wide uppercase opacity-70">Récompense</p>
              <p className="mt-1 truncate text-2xl font-bold">{rewardCaption}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 px-4 pb-2">
            <div>
              <p className="text-[10px] tracking-wide uppercase opacity-60">
                {displayMode === "stamps" ? "Solde de tampons" : "Solde de points"}
              </p>
              <p className="mt-0.5 text-lg font-semibold">
                {displayMode === "stamps" ? previewFilled : previewPoints}
              </p>
            </div>
            <div>
              <p className="text-[10px] tracking-wide uppercase opacity-60">Objectif</p>
              <p className="mt-0.5 text-lg font-semibold">
                {displayMode === "stamps" ? `${stampCount} tampons` : `${rewardThreshold} points`}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 px-4 pb-5 pt-3">
            <div className="rounded-xl bg-white p-2">
              <QrGlyph className="h-14 w-14" />
            </div>
            <p className="text-[10px] opacity-60">
              {displayMode === "stamps" ? `${previewFilled} tampons` : `${previewPoints} points`}
            </p>
          </div>
        </div>

        <p className="max-w-72 text-xs text-gray-500">
          Le téléphone, le nom du client et la date d&apos;inscription apparaissent au verso de la carte
          (icône ⓘ) sur Apple Wallet — Google Wallet ne les affiche pas du tout.
        </p>
      </div>
    </div>
  );
}
