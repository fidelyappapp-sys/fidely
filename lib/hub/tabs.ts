import type { HubTabKey } from "@/lib/supabase/types";

// Catalog of tabs offerable on a Présence/Pro Hub page — used both by the
// dashboard editor (which tabs can be toggled on) and the public Hub page
// (which tabs are renderable). Kept data-driven so a future Pro-exclusive
// tab is a catalog entry, not a schema change.
export const HUB_TAB_CATALOG: { key: HubTabKey; label: string }[] = [
  { key: "menu", label: "Menu" },
  { key: "avis", label: "Avis Google" },
  { key: "social", label: "Réseaux sociaux" },
  { key: "contact", label: "Contact" },
];

export function hubTabLabel(key: HubTabKey): string {
  return HUB_TAB_CATALOG.find((t) => t.key === key)?.label ?? key;
}
