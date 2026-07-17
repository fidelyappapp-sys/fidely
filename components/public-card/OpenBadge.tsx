import { computeOpenStatus } from "@/lib/openingHours";
import type { OpeningHours } from "@/lib/supabase/types";

export function OpenBadge({ hours }: { hours: OpeningHours }) {
  const status = computeOpenStatus(hours);
  if (!status) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium backdrop-blur ${
        status.isOpen ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-white/70"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${status.isOpen ? "bg-emerald-400" : "bg-white/40"}`}
      />
      {status.label}
    </span>
  );
}
