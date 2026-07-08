"use client";

import { useActionState } from "react";
import { inviteStaffMember, type StaffActionState } from "@/lib/actions/staff";

const initialState: StaffActionState = {};

export function InviteStaffForm() {
  const [state, formAction, pending] = useActionState(inviteStaffMember, initialState);

  return (
    <form action={formAction}>
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email du membre
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="employe@exemple.com"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {pending ? "Envoi..." : "Inviter"}
        </button>
      </div>
      {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="mt-2 text-sm text-green-600">Invitation envoyée.</p>}
    </form>
  );
}
