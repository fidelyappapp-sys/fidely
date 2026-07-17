const PATTERN = [
  [1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1],
  [1, 0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0],
  [1, 1, 0, 1, 1, 1, 0, 0, 1, 1, 0, 1, 1],
  [0, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 0],
  [1, 1, 1, 1, 1, 0, 0, 1, 0, 1, 1, 1, 1],
  [1, 0, 0, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1],
  [1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1],
];

export function QrGlyph({ className = "" }: { className?: string }) {
  return (
    <div
      className={`grid grid-cols-13 gap-[1.5px] rounded-lg bg-white p-2 ${className}`}
      style={{ gridTemplateColumns: "repeat(13, 1fr)" }}
    >
      {PATTERN.flatMap((row, y) =>
        row.map((cell, x) => (
          <span
            key={`${x}-${y}`}
            className={`aspect-square rounded-[1px] ${cell ? "bg-gray-950" : "bg-transparent"}`}
          />
        )),
      )}
    </div>
  );
}
