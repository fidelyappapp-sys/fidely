import type { StampStyle } from "@/lib/supabase/types";

export const STAMP_STYLES: { value: StampStyle; label: string }[] = [
  { value: "circle", label: "Cercle" },
  { value: "star", label: "Étoile" },
  { value: "square", label: "Carré" },
  { value: "triangle", label: "Triangle" },
  { value: "heart", label: "Cœur" },
  { value: "butterfly", label: "Papillon" },
  { value: "diamond", label: "Diamant" },
];

export function StampIcon({
  style,
  filled,
  className = "",
}: {
  style: StampStyle;
  filled: boolean;
  className?: string;
}) {
  const shapeClass = filled ? "fill-current" : "fill-none stroke-current stroke-[1.5]";

  switch (style) {
    case "square":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <rect x="3.5" y="3.5" width="17" height="17" rx="3" className={shapeClass} />
        </svg>
      );
    case "triangle":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path d="M12 3l9 18H3z" className={shapeClass} strokeLinejoin="round" />
        </svg>
      );
    case "diamond":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path d="M12 2l7 10-7 10-7-10z" className={shapeClass} strokeLinejoin="round" />
        </svg>
      );
    case "heart":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path
            d="M12 21s-7.5-4.7-10-9.3C.4 8.1 2.3 4.5 6 4.5c2 0 3.5 1 6 3.5 2.5-2.5 4-3.5 6-3.5 3.7 0 5.6 3.6 4 7.2C19.5 16.3 12 21 12 21z"
            className={shapeClass}
            strokeLinejoin="round"
          />
        </svg>
      );
    case "star":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path
            d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.9L5.7 21l1.7-7L2 9.2l7.1-.6z"
            className={shapeClass}
            strokeLinejoin="round"
          />
        </svg>
      );
    case "butterfly":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <g className={shapeClass}>
            <ellipse cx="7" cy="8.5" rx="5" ry="5.5" />
            <ellipse cx="17" cy="8.5" rx="5" ry="5.5" />
            <ellipse cx="7.5" cy="16" rx="3.8" ry="4" />
            <ellipse cx="16.5" cy="16" rx="3.8" ry="4" />
          </g>
          <rect x="11.3" y="3" width="1.4" height="18" rx="0.7" className="fill-current" />
        </svg>
      );
    case "circle":
    default:
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <circle cx="12" cy="12" r="9" className={shapeClass} />
        </svg>
      );
  }
}
