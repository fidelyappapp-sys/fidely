import type { SectorKey } from "@/lib/supabase/types";

// Sector icon shown as the default logo placeholder before a merchant
// uploads their own (see CardCustomizer) — an explicit picker, not derived
// from the free-text business_type field used elsewhere.
export const SECTORS: { value: SectorKey; label: string }[] = [
  { value: "restaurant", label: "Restaurant" },
  { value: "food_truck", label: "Food truck" },
  { value: "bar", label: "Bar" },
  { value: "hairdresser", label: "Coiffeur" },
  { value: "cafe", label: "Café" },
  { value: "bakery", label: "Boulangerie" },
  { value: "beauty_spa", label: "Institut de beauté / Spa" },
  { value: "gym", label: "Salle de sport" },
  { value: "dry_cleaning", label: "Pressing" },
  { value: "garage", label: "Garage" },
  { value: "florist", label: "Fleuriste" },
  { value: "bookstore", label: "Librairie" },
  { value: "pet_shop", label: "Animalerie" },
  { value: "pharmacy", label: "Pharmacie" },
  { value: "cinema", label: "Cinéma" },
];

export function SectorIcon({ sector, className = "" }: { sector: SectorKey; className?: string }) {
  const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  switch (sector) {
    case "restaurant":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <g {...stroke}>
            <path d="M7 2v7a2 2 0 0 0 4 0V2M9 9v13M9 2v7" />
            <path d="M16 2c-1.5 0-2.5 2-2.5 5s1 5 2.5 5v10" />
          </g>
        </svg>
      );
    case "food_truck":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <g {...stroke}>
            <path d="M3 16V8a1 1 0 0 1 1-1h9v9" />
            <path d="M13 10h5l3 3v3h-8z" />
            <circle cx="7" cy="18" r="1.6" />
            <circle cx="17" cy="18" r="1.6" />
          </g>
        </svg>
      );
    case "bar":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <g {...stroke}>
            <path d="M5 4h14l-6.5 8v7M12 19H9m3-7L5 4" />
          </g>
        </svg>
      );
    case "hairdresser":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <g {...stroke}>
            <circle cx="6.5" cy="7" r="2.5" />
            <circle cx="6.5" cy="17" r="2.5" />
            <path d="M20 5 8.5 12 20 19M8.5 12 5 12" />
          </g>
        </svg>
      );
    case "cafe":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <g {...stroke}>
            <path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" />
            <path d="M17 9h1.5a2.5 2.5 0 0 1 0 5H17" />
            <path d="M7 3c0 1-1 1-1 2s1 1 1 2M11 3c0 1-1 1-1 2s1 1 1 2" />
          </g>
        </svg>
      );
    case "bakery":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path
            d="M12 4c2 0 3 2 5 2 2.5 0 3.5 2.5 2.5 4.5 1.5.5 2 2 1 3.5-.5 1-1.5 1-1.5 1H5s-1 0-1.5-1c-1-1.5-.5-3 1-3.5C3.5 8.5 4.5 6 7 6c2 0 3-2 5-2z"
            {...stroke}
          />
        </svg>
      );
    case "beauty_spa":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <g {...stroke}>
            <path d="M12 3c2 3 2 5 0 7-2-2-2-4 0-7zM6 9c2 2 2 4 0 6-2-2-2-4 0-6zM18 9c2 2 2 4 0 6-2-2-2-4 0-6z" />
            <path d="M4 20c2-2 4-3 8-3s6 1 8 3" />
          </g>
        </svg>
      );
    case "gym":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <g {...stroke}>
            <path d="M2 12h2M20 12h2M5 9v6M19 9v6M8 12h8" />
            <rect x="5" y="9" width="0.01" height="0.01" />
          </g>
        </svg>
      );
    case "dry_cleaning":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <g {...stroke}>
            <path d="M12 3a3 3 0 0 0-3 3" />
            <path d="M4 10l8-5 8 5" />
            <path d="M6 10 3 20h18l-3-10" />
          </g>
        </svg>
      );
    case "garage":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <g {...stroke}>
            <path d="M12 4 4 9v2h16V9zM4 11v9h16v-9" />
            <path d="M8 20v-4M16 20v-4" />
          </g>
        </svg>
      );
    case "florist":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <g {...stroke}>
            <circle cx="12" cy="7" r="2" />
            <circle cx="8" cy="10" r="2" />
            <circle cx="16" cy="10" r="2" />
            <circle cx="12" cy="12" r="2" />
            <path d="M12 14v7" />
          </g>
        </svg>
      );
    case "bookstore":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <g {...stroke}>
            <path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4z" />
            <path d="M20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z" />
          </g>
        </svg>
      );
    case "pet_shop":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <g {...stroke}>
            <circle cx="7" cy="6" r="1.4" />
            <circle cx="12" cy="4.5" r="1.4" />
            <circle cx="17" cy="6" r="1.4" />
            <circle cx="19" cy="10.5" r="1.4" />
            <path d="M12 20c-3.5 0-6-1.8-6-4.5 0-1.8 1.5-2.5 2.5-3.8 1-1.3.5-2.7 2-2.7h3c1.5 0 1 1.4 2 2.7 1 1.3 2.5 2 2.5 3.8 0 2.7-2.5 4.5-6 4.5z" />
          </g>
        </svg>
      );
    case "pharmacy":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <g {...stroke}>
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <path d="M12 7v10M7 12h10" />
          </g>
        </svg>
      );
    case "cinema":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <g {...stroke}>
            <path d="M3 8l1.5-5h15L21 8z" />
            <rect x="3" y="8" width="18" height="12" rx="1" />
            <path d="M8 8 6.5 3M14 8l-1-5M18.5 8l-1.5-5" />
          </g>
        </svg>
      );
    default:
      return null;
  }
}
