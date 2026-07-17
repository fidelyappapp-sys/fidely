import { CountUp } from "./CountUp";

const stats = [
  { value: 42, suffix: "%", label: "de clients qui reviennent grâce à leur carte" },
  { value: 0, suffix: "", label: "application à télécharger pour vos clients" },
  { value: 10, suffix: " cts", label: "par scan, c'est tout ce que ça vous coûte" },
];

export function KeyStats() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <div className="grid gap-8 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              <CountUp value={stat.value} suffix={stat.suffix} />
            </p>
            <p className="mt-3 text-sm text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
