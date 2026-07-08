"use client";

import { useActionState } from "react";
import { completeOnboarding, type OnboardingState } from "@/lib/actions/onboarding";

const initialState: OnboardingState = {};

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState(completeOnboarding, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
          Nom du commerce
        </label>
        <input
          id="businessName"
          name="businessName"
          required
          placeholder="Café des Arts"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
          Lien public
        </label>
        <div className="mt-1 flex items-center rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <span className="text-gray-400">fidely.app/join/</span>
          <input
            id="slug"
            name="slug"
            required
            placeholder="cafe-des-arts"
            pattern="[a-z0-9-]+"
            className="flex-1 outline-none"
          />
        </div>
      </div>

      <div>
        <label htmlFor="brandColor" className="block text-sm font-medium text-gray-700">
          Couleur de marque
        </label>
        <input
          id="brandColor"
          name="brandColor"
          type="color"
          defaultValue="#111827"
          className="mt-1 h-10 w-16 cursor-pointer rounded border border-gray-300"
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
            defaultValue={1}
            required
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
            defaultValue={10}
            required
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
          placeholder="1 café offert"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {pending ? "Création..." : "Créer mon programme de fidélité"}
      </button>
    </form>
  );
}
