"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset, type AuthActionState } from "@/lib/actions/auth";

const initialState: AuthActionState & { sent?: boolean } = {};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);

  if (state.sent) {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Vérifiez vos emails</h1>
        <p className="text-sm text-gray-600">
          Si un compte existe avec cette adresse, un lien de réinitialisation vient de vous être
          envoyé.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <h1 className="text-xl font-semibold">Mot de passe oublié</h1>
      <p className="text-sm text-gray-600">
        Recevez un lien par email pour choisir un nouveau mot de passe.
      </p>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {pending ? "Envoi..." : "Recevoir le lien"}
      </button>

      <div className="text-center text-sm text-gray-500">
        <Link href="/login" className="hover:text-gray-900">
          Retour à la connexion
        </Link>
      </div>
    </form>
  );
}
