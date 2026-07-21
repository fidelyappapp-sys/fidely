import type { MonthlySubscriberPoint } from "@/lib/admin";

// Hand-rolled inline SVG bar chart — avoids pulling in a charting library
// for a single admin-only visualization.
export function SubscriptionsChart({ points }: { points: MonthlySubscriberPoint[] }) {
  const width = 720;
  const height = 220;
  const paddingBottom = 24;
  const paddingTop = 12;
  const barGap = 8;
  const barWidth = (width - barGap * (points.length - 1)) / points.length;
  const max = Math.max(1, ...points.map((p) => p.count));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Évolution des abonnements sur 12 mois">
      {points.map((p, i) => {
        const barHeight = ((height - paddingBottom - paddingTop) * p.count) / max;
        const x = i * (barWidth + barGap);
        const y = height - paddingBottom - barHeight;
        return (
          <g key={p.label}>
            <rect x={x} y={y} width={barWidth} height={barHeight} rx={3} className="fill-gray-900" />
            <text x={x + barWidth / 2} y={height - 6} textAnchor="middle" className="fill-gray-500 text-[10px]">
              {p.label}
            </text>
            <text x={x + barWidth / 2} y={y - 4} textAnchor="middle" className="fill-gray-700 text-[10px] font-medium">
              {p.count}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
