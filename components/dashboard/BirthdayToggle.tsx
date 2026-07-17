"use client";

import { useActionState, useRef } from "react";
import {
  toggleBirthdayNotifications,
  type NotificationActionState,
} from "@/lib/actions/notifications";

const initialState: NotificationActionState = {};

export function BirthdayToggle({ enabled }: { enabled: boolean }) {
  const [state, formAction] = useActionState(toggleBirthdayNotifications, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={formAction} className="flex items-start gap-3">
      <input
        id="enabled"
        name="enabled"
        type="checkbox"
        defaultChecked={enabled}
        onChange={() => formRef.current?.requestSubmit()}
        className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
      />
      <label htmlFor="enabled" className="text-sm text-gray-700">
        Envoyer automatiquement une notification d&apos;anniversaire à vos clients, avec une
        offre spéciale.
        {state.error && <span className="mt-1 block text-red-600">{state.error}</span>}
      </label>
    </form>
  );
}
