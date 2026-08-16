"use client";

import { useRouter } from "next/navigation";

export interface PosOption {
  id: string;
  label: string;
  city: string | null;
}

// Shared by the Program and Clients dashboard pages: switches which point
// of sale (merchant_qr_codes row) the page is scoped to via a `?pos=` query
// param navigation.
export function PosSelector({
  items,
  selectedId,
  basePath,
  allowAll = false,
}: {
  items: PosOption[];
  selectedId: string | null;
  basePath: string;
  allowAll?: boolean;
}) {
  const router = useRouter();

  return (
    <select
      value={selectedId ?? ""}
      onChange={(e) => router.push(`${basePath}?pos=${e.target.value}`)}
      className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
    >
      {/* "all" is a distinct value from unset (no ?pos= param at all) —
          callers that need to tell "merchant hasn't chosen yet" apart from
          "merchant explicitly chose everything" rely on that distinction
          (see app/(dashboard)/dashboard/notifications/page.tsx). */}
      {allowAll && <option value="all">Tous les points de vente</option>}
      {items.map((item) => (
        <option key={item.id} value={item.id}>
          {item.label}
          {item.city ? ` (${item.city})` : ""}
        </option>
      ))}
    </select>
  );
}
