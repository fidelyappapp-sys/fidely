"use client";

import { useActionState } from "react";
import {
  sendBroadcastNotification,
  type NotificationActionState,
} from "@/lib/actions/notifications";

const initialState: NotificationActionState = {};

export function NotificationsForm({
  recipientCount,
  posId,
}: {
  recipientCount: number;
  // Which point of sale this send is scoped to — null means "Tous les
  // points de vente", an explicit choice from the selector above, not the
  // default (see app/(dashboard)/dashboard/notifications/page.tsx).
  posId: string | null;
}) {
  const [state, formAction, pending] = useActionState(sendBroadcastNotification, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (
          !window.confirm(
            `Envoyer cette notification à vos ${recipientCount} client${recipientCount > 1 ? "s" : ""} ?`
          )
        ) {
          event.preventDefault();
        }
      }}
      className="max-w-md space-y-5"
    >
      {posId && <input type="hidden" name="posId" value={posId} />}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Titre
        </label>
        <input
          id="title"
          name="title"
          required
          maxLength={80}
          placeholder="Offre spéciale"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="body" className="block text-sm font-medium text-gray-700">
          Message
        </label>
        <textarea
          id="body"
          name="body"
          required
          maxLength={300}
          rows={3}
          placeholder="-20% sur toute la boutique ce week-end !"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-green-600">Notification envoyée.</p>}

      <button
        type="submit"
        disabled={pending || recipientCount === 0}
        className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {pending
          ? "Envoi..."
          : `Envoyer à ${recipientCount} client${recipientCount > 1 ? "s" : ""}`}
      </button>
    </form>
  );
}
