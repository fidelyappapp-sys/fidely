"use client";

import { useActionState, useState } from "react";
import { assignPlaqueCode, type AssignPlaqueActionState } from "@/lib/actions/adminPlaques";
import { buildGoogleReviewUrl } from "@/lib/googleReview";
import type { PlaqueTier, StandalonePlaqueTabKey } from "@/lib/supabase/types";

const initialState: AssignPlaqueActionState = {};

const TAB_OPTIONS: { key: StandalonePlaqueTabKey; label: string }[] = [
  { key: "accueil", label: "Accueil" },
  { key: "avis", label: "Avis Google" },
  { key: "menu", label: "Menu" },
  { key: "offres", label: "Offres" },
];

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
    redirectUrl: string | null;
    enabledTabs: StandalonePlaqueTabKey[] | null;
    loyaltyEnabled: boolean;
  };
}) {
  const action = assignPlaqueCode.bind(null, code);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [tier, setTier] = useState<PlaqueTier | "">(initial.tier ?? "");
  const [placeId, setPlaceId] = useState(initial.googlePlaceId ?? "");
  const [redirectUrl, setRedirectUrl] = useState(initial.redirectUrl ?? "");

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
        <div>
          <label className="block text-sm font-medium text-gray-700">URL de redirection</label>
          <input
            name="redirectUrl"
            required
            value={redirectUrl}
            onChange={(e) => setRedirectUrl(e.target.value)}
            placeholder="https://..."
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          {placeId && (
            <button
              type="button"
              onClick={() => setRedirectUrl(buildGoogleReviewUrl(placeId))}
              className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-500"
            >
              Utiliser le lien d&apos;avis Google calculé
            </button>
          )}
        </div>
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
