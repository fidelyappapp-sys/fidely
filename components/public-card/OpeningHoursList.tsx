import { DAY_LABELS } from "@/lib/openingHours";
import type { OpeningHours, WeekDay } from "@/lib/supabase/types";

const DAY_ORDER: WeekDay[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function parisTodayKey(): WeekDay {
  const weekday = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "short",
  })
    .format(new Date())
    .toLowerCase()
    .replace(".", "");
  const map: Record<string, WeekDay> = {
    lun: "mon",
    mar: "tue",
    mer: "wed",
    jeu: "thu",
    ven: "fri",
    sam: "sat",
    dim: "sun",
  };
  return map[weekday] ?? "mon";
}

export function OpeningHoursList({ hours }: { hours: OpeningHours }) {
  if (!hours || hours.length === 0) return null;
  const today = parisTodayKey();

  return (
    <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100">
      {DAY_ORDER.map((day) => {
        const entry = hours.find((h) => h.day === day);
        const isToday = day === today;
        return (
          <li
            key={day}
            className={`flex items-center justify-between px-4 py-2.5 text-sm ${
              isToday ? "bg-gray-50 font-medium text-gray-900" : "text-gray-600"
            }`}
          >
            <span>{DAY_LABELS[day]}</span>
            <span>{!entry || entry.closed ? "Fermé" : `${entry.open} – ${entry.close}`}</span>
          </li>
        );
      })}
    </ul>
  );
}
