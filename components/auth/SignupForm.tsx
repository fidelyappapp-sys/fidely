"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpWithPassword, type AuthActionState } from "@/lib/actions/auth";

const initialState: AuthActionState & { sent?: boolean } = {};

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signUpWithPassword, initialState);

  if (state.sent) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-xl font-semibold">Vérifiez votre boîte mail</h1>
        <p className="text-sm text-gray-600">
          Un email de confirmation vient d&apos;être envoyé. Cliquez sur le lien qu&apos;il
          contient pour activer votre compte et continuer l&apos;inscription.
        </p>
        <p className="text-sm text-gray-500">
          Rien reçu ? Vérifiez vos spams, ou{" "}
          <Link href="/signup" className="text-gray-900 hover:underline">
            réessayez avec une autre adresse
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <h1 className="text-xl font-semibold">Créer votre compte commerçant</h1>

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

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          minLength={8}
          required
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
        <p className="mt-1 text-xs text-gray-500">8 caractères minimum.</p>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {pending ? "Création..." : "Créer mon compte"}
      </button>

      <p className="text-center text-sm text-gray-500">
        Déjà inscrit ?{" "}
        <Link href="/login" className="text-gray-900 hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
