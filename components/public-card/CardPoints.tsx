"use client";

import { useEffect, useState } from "react";

interface CardData {
  points: number;
  displayMode: "stamps" | "points";
  stampCount: number;
  rewardThreshold: number;
  rewardDescription: string;
}

// Polls the public card endpoint so the customer sees their point balance
// update live right after a staff scan, without needing a native push
// (that role is filled by the wallet pass update on Apple/Google Wallet).
// Mirrors the real pass's field layout (primaryFields/secondaryFields/
// auxiliaryFields — see lib/wallet/apple/pkpass.ts) rather than a separate
// icon-grid design: no stamp icons exist on the actual wallet card, so this
// page shouldn't show one either.
export function CardPoints({ publicId, initial }: { publicId: string; initial: CardData }) {
  const [data, setData] = useState(initial);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/cards/${publicId}`, { cache: "no-store" });
        if (res.ok) setData(await res.json());
      } catch {
        // ignore transient network errors, next poll will retry
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [publicId]);

  const isStamps = data.displayMode === "stamps";

  return (
    <div>
      <p className="text-[10px] font-medium tracking-wide uppercase opacity-70">Récompense</p>
      <p className="mt-1 text-2xl font-bold">{data.rewardDescription}</p>

      <div className="mt-4 flex items-center justify-center gap-10">
        <div>
          <p className="text-[10px] tracking-wide uppercase opacity-60">
            {isStamps ? "Solde de tampons" : "Solde de points"}
          </p>
          <p className="mt-0.5 text-lg font-semibold">{data.points}</p>
        </div>
        <div>
          <p className="text-[10px] tracking-wide uppercase opacity-60">Objectif</p>
          <p className="mt-0.5 text-lg font-semibold">
            {isStamps ? `${data.stampCount} tampons` : `${data.rewardThreshold} points`}
          </p>
        </div>
      </div>
    </div>
  );
}
