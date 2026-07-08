"use client";

import { useActionState } from "react";
import { updateProgram, type ProgramActionState } from "@/lib/actions/program";

const initialState: ProgramActionState = {};

export function ProgramForm({
  program,
}: {
  program: {
    name: string;
    points_per_scan: number;
    reward_threshold: number;
    reward_description: string;
  };
}) {
  const [state, formAction, pending] = useActionState(updateProgram, initialState);

  return (
    <form action={formAction} className="max-w-md space-y-5">
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="pointsPerScan" className="block text-sm font-medium text-gray-700">
            Points / scan
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
          <label htmlFor="rewardThreshold" className="block text-sm font-medium text-gray-700">
            Seuil de récompense
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
      </div>

      <div>
        <label htmlFor="rewardDescription" className="block text-sm font-medium text-gray-700">
          Récompense
        </label>
        <input
          id="rewardDescription"
          name="rewardDescription"
          required
          defaultValue={program.reward_description}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-green-600">Programme mis à jour.</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {pending ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}
