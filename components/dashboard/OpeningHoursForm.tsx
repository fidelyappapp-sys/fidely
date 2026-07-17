"use client";

import { useActionState, useState } from "react";
import { updateOpeningHours, type SettingsActionState } from "@/lib/actions/settings";
import type { OpeningHours, WeekDay } from "@/lib/supabase/types";

const DAYS: { key: WeekDay; label: string }[] = [
  { key: "mon", label: "Lundi" },
  { key: "tue", label: "Mardi" },
  { key: "wed", label: "Mercredi" },
  { key: "thu", label: "Jeudi" },
  { key: "fri", label: "Vendredi" },
  { key: "sat", label: "Samedi" },
  { key: "sun", label: "Dimanche" },
];

function withDefaults(hours: OpeningHours): OpeningHours {
  return DAYS.map(({ key }) => {
    const existing = hours.find((h) => h.day === key);
    return existing ?? { day: key, closed: key === "sun", open: "09:00", close: "19:00" };
  });
}

const initialState: SettingsActionState = {};

export function OpeningHoursForm({ hours }: { hours: OpeningHours }) {
  const [state, formAction, pending] = useActionState(updateOpeningHours, initialState);
  const [rows, setRows] = useState<OpeningHours>(() => withDefaults(hours));

  function update(day: WeekDay, patch: Partial<OpeningHours[number]>) {
    setRows((prev) => prev.map((r) => (r.day === day ? { ...r, ...patch } : r)));
  }

  return (
    <form action={formAction} className="max-w-lg">
      <input type="hidden" name="openingHours" value={JSON.stringify(rows)} />
      <div className="divide-y divide-gray-100 rounded-xl border border-gray-200">
        {rows.map((row) => {
          const label = DAYS.find((d) => d.key === row.day)?.label ?? row.day;
          return (
            <div key={row.day} className="flex items-center gap-3 px-4 py-3">
              <span className="w-24 shrink-0 text-sm font-medium text-gray-900">{label}</span>
              <label className="flex shrink-0 items-center gap-1.5 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={row.closed}
                  onChange={(e) => update(row.day, { closed: e.target.checked })}
                  className="rounded border-gray-300"
                />
                Fermé
              </label>
              {!row.closed && (
                <div className="flex flex-1 items-center justify-end gap-2">
                  <input
                    type="time"
                    value={row.open}
                    onChange={(e) => update(row.day, { open: e.target.value })}
                    className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
                  />
                  <span className="text-gray-400">–</span>
                  <input
                    type="time"
                    value={row.close}
                    onChange={(e) => update(row.day, { close: e.target.value })}
                    className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {state.error && <p className="mt-3 text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="mt-3 text-sm text-green-600">Horaires enregistrés.</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {pending ? "Enregistrement..." : "Enregistrer les horaires"}
      </button>
    </form>
  );
}
