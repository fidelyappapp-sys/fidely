"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";

type ScanResult =
  | {
      status: "success";
      publicId: string;
      customerName: string | null;
      pointsAwarded: number;
      pointsBalance: number;
      rewardClaimed: boolean;
      rewardDescription: string | null;
    }
  | { status: "error"; message: string };

// Two-tone confirmation beep via Web Audio — no audio asset to load/host.
function playBeep() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const now = ctx.currentTime;

    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = now + i * 0.09;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.09);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.1);
    });

    setTimeout(() => ctx.close(), 400);
  } catch {
    // Web Audio unsupported — fail silently, the visual flash still confirms the scan.
  }
}

export function Scanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const busyRef = useRef(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [adjusting, setAdjusting] = useState(false);
  const [flash, setFlash] = useState(false);

  const handleDecoded = useCallback(async (payload: string) => {
    busyRef.current = true;
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload }),
      });
      const data = await res.json();

      if (!res.ok) {
        setResult({ status: "error", message: data.error ?? "Erreur lors du scan." });
      } else {
        // The QR payload is "<publicId>.<hmac>" — the server already
        // verified the signature, this just extracts the id for the
        // +/- adjustment buttons below.
        const publicId = payload.slice(0, payload.lastIndexOf("."));
        setResult({
          status: "success",
          publicId,
          customerName: data.customerName,
          pointsAwarded: data.pointsAwarded,
          pointsBalance: data.pointsBalance,
          rewardClaimed: Boolean(data.rewardClaimed),
          rewardDescription: data.rewardDescription ?? null,
        });
        playBeep();
        if (navigator.vibrate) navigator.vibrate(120);
        setFlash(true);
        setTimeout(() => setFlash(false), 500);
      }
    } catch {
      setResult({ status: "error", message: "Erreur réseau, réessayez." });
    } finally {
      // brief cooldown so the same badge isn't scanned twice in a row
      setTimeout(() => {
        busyRef.current = false;
      }, 2500);
    }
  }, []);

  const adjustPoints = useCallback(
    async (delta: number) => {
      if (!result || result.status !== "success") return;

      setAdjusting(true);
      try {
        const res = await fetch("/api/cards/points", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicId: result.publicId, delta }),
        });
        const data = await res.json();

        setResult((prev) => {
          if (!prev || prev.status !== "success") return prev;
          if (!res.ok) return { status: "error", message: data.error ?? "Erreur." };
          return { ...prev, pointsBalance: data.pointsBalance };
        });
      } catch {
        setResult({ status: "error", message: "Erreur réseau, réessayez." });
      } finally {
        setAdjusting(false);
      }
    },
    [result]
  );

  useEffect(() => {
    const codeReader = new BrowserQRCodeReader();
    let cancelled = false;

    codeReader
      .decodeFromVideoDevice(undefined, videoRef.current!, (scanResult) => {
        if (cancelled || !scanResult || busyRef.current) return;
        void handleDecoded(scanResult.getText());
      })
      .then((controls) => {
        if (cancelled) {
          controls.stop();
        } else {
          controlsRef.current = controls;
        }
      })
      .catch((err) => {
        setCameraError(
          err instanceof Error ? err.message : "Impossible d'accéder à la caméra."
        );
      });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
  }, [handleDecoded]);

  return (
    <div className="max-w-md">
      <div className="relative overflow-hidden rounded-2xl bg-black">
        <video ref={videoRef} className="aspect-square w-full object-cover" muted playsInline />

        {!cameraError && (
          <div
            aria-hidden
            className="animate-scan-laser pointer-events-none absolute inset-x-0 h-0.5 bg-red-500 shadow-[0_0_8px_2px_rgba(239,68,68,0.8)]"
          />
        )}

        {flash && (
          <div aria-hidden className="animate-scan-flash pointer-events-none absolute inset-0 bg-green-400" />
        )}
      </div>

      {cameraError && (
        <p className="mt-4 text-sm text-red-600">
          {cameraError} Vérifiez que l&apos;accès à la caméra est autorisé pour ce site.
        </p>
      )}

      {result?.status === "success" && result.rewardClaimed && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-medium text-amber-900">🎉 {result.customerName ?? "Client"}</p>
          <p className="mt-1 text-sm text-amber-800">
            Récompense débloquée : {result.rewardDescription}
          </p>
          <p className="mt-1 text-xs text-amber-700">Ses points repartent à 0.</p>
        </div>
      )}

      {result?.status === "success" && !result.rewardClaimed && (
        <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4">
          <p className="font-medium text-green-800">
            {result.customerName ?? "Client"}
          </p>
          <p className="mt-1 text-sm text-green-700">
            +{result.pointsAwarded} points au scan
          </p>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-white p-3">
            <button
              type="button"
              onClick={() => adjustPoints(-1)}
              disabled={adjusting}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-lg font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-50"
              aria-label="Retirer un point"
            >
              −
            </button>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{result.pointsBalance}</p>
              <p className="text-xs text-gray-500">points</p>
            </div>
            <button
              type="button"
              onClick={() => adjustPoints(1)}
              disabled={adjusting}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-lg font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
              aria-label="Ajouter un point"
            >
              +
            </button>
          </div>
        </div>
      )}

      {result?.status === "error" && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{result.message}</p>
        </div>
      )}

      <p className="mt-4 text-sm text-gray-500">
        Placez le QR code du client devant la caméra pour attribuer ses points automatiquement.
      </p>
    </div>
  );
}
