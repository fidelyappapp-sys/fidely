"use client";

import { useActionState } from "react";
import { createMerchantDraft, type OnboardingState } from "@/lib/actions/onboarding";

const initialState: OnboardingState = {};

export function OnboardingInfosForm() {
  const [state, formAction, pending] = useActionState(createMerchantDraft, initialState);

  return (
    <form action={formAction} className="mx-auto max-w-sm space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="ownerFirstName" className="block text-sm font-medium text-gray-700">
            Prénom
          </label>
          <input
            id="ownerFirstName"
            name="ownerFirstName"
            required
            placeholder="Jean"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="ownerLastName" className="block text-sm font-medium text-gray-700">
            Nom
          </label>
          <input
            id="ownerLastName"
            name="ownerLastName"
            required
            placeholder="Dupont"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label htmlFor="ownerPhone" className="block text-sm font-medium text-gray-700">
          Téléphone
        </label>
        <input
          id="ownerPhone"
          name="ownerPhone"
          type="tel"
          required
          placeholder="06 12 34 56 78"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
      </div>

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

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {pending ? "Création..." : "Continuer"}
      </button>
    </form>
  );
}
