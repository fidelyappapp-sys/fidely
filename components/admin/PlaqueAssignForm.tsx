"use client";

import { useActionState, useState } from "react";
import { assignPlaqueCode, type AssignPlaqueActionState } from "@/lib/actions/adminPlaques";
import { buildGoogleReviewUrl } from "@/lib/googleReview";
import type { PlaqueLinkType, PlaqueTier, StandalonePlaqueTabKey } from "@/lib/supabase/types";

const initialState: AssignPlaqueActionState = {};

const TAB_OPTIONS: { key: StandalonePlaqueTabKey; label: string }[] = [
  { key: "accueil", label: "Accueil" },
  { key: "avis", label: "Avis Google" },
  { key: "menu", label: "Menu" },
  { key: "offres", label: "Offres" },
];

const LINK_TYPE_OPTIONS: { key: PlaqueLinkType; label: string }[] = [
  { key: "google_review", label: "Avis Google" },
  { key: "tripadvisor", label: "TripAdvisor" },
  { key: "social", label: "Réseaux sociaux" },
  { key: "menu", label: "Menu / catalogue" },
  { key: "vcard", label: "Fiche contact (vCard)" },
  { key: "website", label: "Site web" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "reservation", label: "Réservation" },
  { key: "linktree", label: "Page de liens multiples" },
  { key: "loyalty", label: "Programme de fidélité / coupon" },
  { key: "other", label: "Autre" },
];

const LINK_TYPE_URL_LABELS: Partial<Record<PlaqueLinkType, string>> = {
  tripadvisor: "Lien TripAdvisor",
  social: "Lien réseau social",
  menu: "Lien du menu / catalogue",
  website: "URL du site",
  whatsapp: "Lien WhatsApp (https://wa.me/...)",
  reservation: "Lien de réservation",
  linktree: "Lien de la page",
  loyalty: "Lien du programme / coupon",
  other: "URL",
};

export function PlaqueAssignForm({
  code,
  initial,
}: {
  code: string;
  initial: {
    tier: PlaqueTier | null;
    merchantName: string | null;
    merchantAddress: string | null;
    googlePlaceId: string | null;
    linkType: PlaqueLinkType | null;
    redirectUrl: string | null;
    vcardName: string | null;
    vcardPhone: string | null;
    vcardAddress: string | null;
    enabledTabs: StandalonePlaqueTabKey[] | null;
    loyaltyEnabled: boolean;
  };
}) {
  const action = assignPlaqueCode.bind(null, code);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [tier, setTier] = useState<PlaqueTier | "">(initial.tier ?? "");
  const [placeId, setPlaceId] = useState(initial.googlePlaceId ?? "");
  const [redirectUrl, setRedirectUrl] = useState(initial.redirectUrl ?? "");
  const [linkType, setLinkType] = useState<PlaqueLinkType | "">(initial.linkType ?? "");

  return (
    <form action={formAction} className="max-w-lg space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700">Formule</label>
        <select
          name="tier"
          required
          value={tier}
          onChange={(e) => setTier(e.target.value as PlaqueTier)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Choisir...
          </option>
          <option value="avis">Plaque — 30€ (redirection unique)</option>
          <option value="presence">Carte — 40€ (page à onglets)</option>
          <option value="pro">Carte + abonnement — 50€ (onglets + fidélité)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Nom du commerçant</label>
        <input
          name="merchantName"
          required
          defaultValue={initial.merchantName ?? ""}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Adresse</label>
        <input
          name="merchantAddress"
          defaultValue={initial.merchantAddress ?? ""}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Google Place ID</label>
        <input
          name="googlePlaceId"
          value={placeId}
          onChange={(e) => setPlaceId(e.target.value)}
          placeholder="ChIJn4IC8m733UcR__3lfMcpG9k"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        {placeId && <p className="mt-1 truncate text-xs text-gray-400">{buildGoogleReviewUrl(placeId)}</p>}
      </div>

      {tier === "avis" && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700">Destination de la plaque</label>
            <select
              name="linkType"
              required
              value={linkType}
              onChange={(e) => setLinkType(e.target.value as PlaqueLinkType)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="" disabled>
                Choisir...
              </option>
              {LINK_TYPE_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-400">Un seul choix actif à la fois — le changer remplace la destination précédente.</p>
          </div>

          {linkType === "google_review" && (
            <p className="text-sm text-gray-600">
              {placeId
                ? `Redirige vers ${buildGoogleReviewUrl(placeId)}`
                : "Renseignez le Google Place ID ci-dessus pour calculer le lien."}
            </p>
          )}

          {linkType === "vcard" && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nom (fiche contact)</label>
                <input
                  name="vcardName"
                  required
                  defaultValue={initial.vcardName ?? ""}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                <input
                  name="vcardPhone"
                  defaultValue={initial.vcardPhone ?? ""}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Adresse (fiche contact)</label>
                <input
                  name="vcardAddress"
                  defaultValue={initial.vcardAddress ?? ""}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}

          {linkType !== "" && linkType !== "google_review" && linkType !== "vcard" && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {LINK_TYPE_URL_LABELS[linkType as PlaqueLinkType] ?? "URL"}
              </label>
              <input
                name="redirectUrl"
                required
                value={redirectUrl}
                onChange={(e) => setRedirectUrl(e.target.value)}
                placeholder="https://..."
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          )}
        </>
      )}

      {(tier === "presence" || tier === "pro") && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Onglets activés</label>
          <div className="mt-2 space-y-2">
            {TAB_OPTIONS.map((opt) => (
              <label key={opt.key} className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="enabledTabs"
                  value={opt.key}
                  defaultChecked={initial.enabledTabs?.includes(opt.key) ?? (opt.key === "accueil" || opt.key === "avis")}
                />
                {opt.label}
              </label>
            ))}
            {tier === "pro" && (
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="enabledTabs"
                  value="fidelite"
                  defaultChecked={initial.enabledTabs?.includes("fidelite") ?? false}
                />
                Fidélité
              </label>
            )}
          </div>
        </div>
      )}

      {tier === "pro" && (
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" name="loyaltyEnabled" defaultChecked={initial.loyaltyEnabled} />
          Activer les fonctionnalités de fidélité
        </label>
      )}

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-green-600">Enregistré.</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {pending ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}
