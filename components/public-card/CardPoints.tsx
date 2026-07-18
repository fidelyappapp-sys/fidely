"use client";

import { useEffect, useState } from "react";
import { StampIcon } from "@/components/StampIcon";
import type { StampStyle } from "@/lib/supabase/types";

interface CardData {
  points: number;
  rewardThreshold: number;
  rewardDescription: string;
}

const MAX_STAMPS = 40;

// Polls the public card endpoint so the customer sees their point balance
// update live right after a staff scan, without needing a native push
// (that role is filled by the wallet pass update on Apple/Google Wallet).
export function CardPoints({
  publicId,
  stampStyle,
  initial,
}: {
  publicId: string;
  stampStyle: StampStyle;
  initial: CardData;
}) {
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

  const progress = Math.min(100, (data.points / Math.max(1, data.rewardThreshold)) * 100);
  const stampCount = Math.min(data.rewardThreshold, MAX_STAMPS);

  return (
    <div>
      <p className="text-5xl font-bold">{data.points}</p>
      <p className="mt-1 text-sm opacity-80">points</p>

      {stampCount > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {Array.from({ length: stampCount }).map((_, i) => (
            <StampIcon
              key={i}
              style={stampStyle}
              filled={i < data.points}
              className={`h-5 w-5 transition-colors ${i < data.points ? "text-white" : "text-white/30"}`}
            />
          ))}
        </div>
      )}

      <div className="mt-4 h-2 rounded-full bg-white/20">
        <div
          className="h-2 rounded-full bg-white transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-2 text-xs opacity-80">
        {data.points} / {data.rewardThreshold} — {data.rewardDescription}
      </p>
    </div>
  );
}
