"use client";

import { useActionState } from "react";
import { sendBroadcastMessage, type BroadcastActionState } from "@/lib/actions/adminBroadcast";

const initialState: BroadcastActionState = {};

export function BroadcastForm() {
  const [state, formAction, pending] = useActionState(sendBroadcastMessage, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <input
        name="subject"
        placeholder="Sujet"
        required
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
      />
      <textarea
        name="body"
        placeholder="Message"
        required
        rows={4}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.sentCount !== undefined && (
        <p className="text-sm text-green-700">Message envoyé à {state.sentCount} commerçant(s).</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {pending ? "Envoi..." : "Envoyer à tous les commerçants"}
      </button>
    </form>
  );
}
