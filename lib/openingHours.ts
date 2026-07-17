import type { OpeningHours, WeekDay } from "@/lib/supabase/types";

const DAY_ORDER: WeekDay[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export const DAY_LABELS: Record<WeekDay, string> = {
  mon: "Lundi",
  tue: "Mardi",
  wed: "Mercredi",
  thu: "Jeudi",
  fri: "Vendredi",
  sat: "Samedi",
  sun: "Dimanche",
};

function parisNow() {
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const weekdayMap: Record<string, WeekDay> = {
    lun: "mon",
    mar: "tue",
    mer: "wed",
    jeu: "thu",
    ven: "fri",
    sam: "sat",
    dim: "sun",
  };
  const day = weekdayMap[get("weekday").toLowerCase().replace(".", "")] ?? "mon";
  const minutes = parseInt(get("hour"), 10) * 60 + parseInt(get("minute"), 10);

  return { day, minutes };
}

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export interface OpenStatus {
  isOpen: boolean;
  label: string;
}

// Assumes each day's hours are same-day (no overnight spans), which fits
// the vast majority of shops/bars this page is built for.
export function computeOpenStatus(hours: OpeningHours): OpenStatus | null {
  if (!hours || hours.length === 0) return null;

  const { day, minutes } = parisNow();
  const today = hours.find((h) => h.day === day);

  if (today && !today.closed) {
    const open = toMinutes(today.open);
    const close = toMinutes(today.close);
    if (minutes >= open && minutes < close) {
      return { isOpen: true, label: `Ouvert · ferme à ${today.close}` };
    }
    if (minutes < open) {
      return { isOpen: false, label: `Fermé · ouvre à ${today.open}` };
    }
  }

  // Find the next day (starting tomorrow) that's open.
  const todayIndex = DAY_ORDER.indexOf(day);
  for (let i = 1; i <= 7; i++) {
    const next = hours.find((h) => h.day === DAY_ORDER[(todayIndex + i) % 7]);
    if (next && !next.closed) {
      const suffix = i === 1 ? "demain" : DAY_LABELS[next.day].toLowerCase();
      return { isOpen: false, label: `Fermé · ouvre ${suffix} à ${next.open}` };
    }
  }

  return { isOpen: false, label: "Fermé" };
}
