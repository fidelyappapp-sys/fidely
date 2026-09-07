"use client";

import { useActionState } from "react";
import { updateAvisLink, type AvisEditActionState } from "@/lib/actions/avisEdit";

const initialState: AvisEditActionState = {};

export function AvisEditForm({ token, initialLink }: { token: string; initialLink: string }) {
  const [state, formAction, pending] = useActionState(updateAvisLink, initialState);

  if (state.success) {
    return (
      <p className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
        Lien mis à jour. Un nouveau lien de modification vous a été envoyé par email — conservez-le pour la prochaine
        fois.
      </p>
    );
  }

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="token" value={token} />
      <input
        type="url"
        name="googleReviewLink"
        required
        defaultValue={initialLink}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {pending ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}
