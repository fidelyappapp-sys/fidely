"use client";

import { useActionState } from "react";
import { adminSignIn, type AdminAuthActionState } from "@/lib/actions/adminAuth";

const initialState: AdminAuthActionState = {};

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(adminSignIn, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <h1 className="text-xl font-semibold">Administration</h1>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {pending ? "Connexion..." : "Se connecter"}
      </button>
    </form>
  );
}
