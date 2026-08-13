"use client";

import { useActionState, useState, type ReactNode } from "react";
import { updateProgram, type ProgramActionState } from "@/lib/actions/program";
import { getRewardSuggestions } from "@/lib/rewardSuggestions";
import type { SectorKey } from "@/lib/supabase/types";

const initialState: ProgramActionState = {};

export function ProgramForm({
  program,
  sector = null,
  action = updateProgram,
  submitLabel = "Enregistrer",
  // Which loyalty_programs row this edits — required by updateProgram to
  // target a single row (a merchant can have several now, one per point of
  // sale). Omitted when this form is used to *create* a new program instead
  // (see createPointOfSale in lib/actions/qrCodes.ts).
  programId,
  // Extra fields (e.g. point-of-sale label/city) rendered above the program
  // fields, submitted as part of the same form — see PointOfSaleManager.
  extraFields,
}: {
  program: {
    name: string;
    display_mode: "stamps" | "points";
    points_per_scan: number;
    stamp_count: number;
    points_per_euro: number | null;
    reward_threshold: number;
    reward_description: string;
  };
  // Used only to pick which quick-suggestion pills to show below the reward
  // field (set on the personalisation step) — not persisted by this form.
  sector?: SectorKey | null;
  // Lets the onboarding wizard reuse this exact component/action and flip
  // onboarding_completed + redirect on success instead of showing "Programme
  // mis à jour." inline (see lib/actions/onboarding.ts).
  action?: (state: ProgramActionState, formData: FormData) => Promise<ProgramActionState>;
  submitLabel?: string;
  programId?: string;
  extraFields?: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [displayMode, setDisplayMode] = useState<"stamps" | "points">(program.display_mode);
  const [rewardDescription, setRewardDescription] = useState(program.reward_description);
  const suggestions = getRewardSuggestions(sector);

  return (
    <form action={formAction} className="max-w-md space-y-5">
      <input type="hidden" name="displayMode" value={displayMode} />
      {programId && <input type="hidden" name="programId" value={programId} />}
      {extraFields}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Nom du programme
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={program.name}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700">Mode de fidélité</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setDisplayMode("stamps")}
            className={`rounded-xl border p-3 text-left text-sm transition ${
              displayMode === "stamps" ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <p className="font-medium text-gray-900">Tampons</p>
            <p className="mt-0.5 text-xs text-gray-500">1 à 20 tampons, 2 rangées de 5.</p>
          </button>
          <button
            type="button"
            onClick={() => setDisplayMode("points")}
            className={`rounded-xl border p-3 text-left text-sm transition ${
              displayMode === "points" ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <p className="font-medium text-gray-900">Points cumulés</p>
            <p className="mt-0.5 text-xs text-gray-500">Conversion € → points au scan.</p>
          </button>
        </div>
      </div>

      {displayMode === "stamps" ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="pointsPerScan" className="block text-sm font-medium text-gray-700">
              Tampons / scan
            </label>
            <input
              id="pointsPerScan"
              name="pointsPerScan"
              type="number"
              min={1}
              required
              defaultValue={program.points_per_scan}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="stampCount" className="block text-sm font-medium text-gray-700">
              Nombre de tampons
            </label>
            <input
              id="stampCount"
              name="stampCount"
              type="number"
              min={1}
              max={20}
              required
              defaultValue={program.stamp_count}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            />
          </div>
        </div>
      ) : (
        <div>
          <label htmlFor="pointsPerEuro" className="block text-sm font-medium text-gray-700">
            Points par euro dépensé
          </label>
          <input
            id="pointsPerEuro"
            name="pointsPerEuro"
            type="number"
            min={0.01}
            step="0.01"
            required
            defaultValue={program.points_per_euro ?? 1}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          />
          <p className="mt-1 text-xs text-gray-500">
            Ex. 2 = 1€ dépensé rapporte 2 points. Le montant est saisi par l&apos;employé au scan.
          </p>
        </div>
      )}

      <div>
        <label htmlFor="rewardThreshold" className="block text-sm font-medium text-gray-700">
          Seuil de récompense {displayMode === "points" ? "(en points)" : "(en tampons)"}
        </label>
        <input
          id="rewardThreshold"
          name="rewardThreshold"
          type="number"
          min={1}
          required
          defaultValue={program.reward_threshold}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="rewardDescription" className="block text-sm font-medium text-gray-700">
          Récompense
        </label>
        <input
          id="rewardDescription"
          name="rewardDescription"
          required
          placeholder="1 café offert"
          value={rewardDescription}
          onChange={(e) => setRewardDescription(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setRewardDescription(suggestion)}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                rewardDescription === suggestion
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-green-600">Programme mis à jour.</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {pending ? "Enregistrement..." : submitLabel}
      </button>
    </form>
  );
}
