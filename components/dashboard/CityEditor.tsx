"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updatePointOfSaleCity } from "@/lib/actions/qrCodes";
import type { QrCodeActionState } from "@/lib/actions/qrCodes";

const initialState: QrCodeActionState = {};

// Inline city edit for a point of sale — used on the main point of sale
// right after the 0023 backfill (city left empty), and available for any
// other point of sale too.
export function CityEditor({ id, city }: { id: string; city: string | null }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updatePointOfSaleCity, initialState);

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <label htmlFor={`city-${id}`} className="text-sm text-gray-600">
        Ville
      </label>
      <input
        id={`city-${id}`}
        name="city"
        defaultValue={city ?? ""}
        placeholder="Paris"
        required
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-900 focus:outline-none"
      />
      <button
        type="submit"
        disabled={pending}
        className="text-xs font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
      >
        {pending ? "..." : "Enregistrer"}
      </button>
      {state.error && <span className="text-xs text-red-600">{state.error}</span>}
    </form>
  );
}
