"use client";

import { useActionState } from "react";
import { createAdditionalMerchant, type AddMerchantState } from "@/lib/actions/boutique";

const initialState: AddMerchantState = {};

export function AddMerchantForm() {
  const [state, formAction, pending] = useActionState(createAdditionalMerchant, initialState);

  return (
    <form action={formAction} className="max-w-lg space-y-3">
      <input
        name="businessName"
        placeholder="Nom du nouveau commerce"
        required
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
      />
      <input
        name="address"
        placeholder="Adresse"
        required
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
      />
      <input
        name="businessType"
        placeholder="Type de commerce (ex: Boulangerie, Coiffeur...)"
        required
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {pending ? "Création..." : "Ajouter ce commerce et commander son kit (13€)"}
      </button>
    </form>
  );
}
