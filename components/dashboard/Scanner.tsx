"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";

type ScanResult =
  | { status: "success"; customerName: string | null; pointsAwarded: number; pointsBalance: number }
  | { status: "error"; message: string };

export function Scanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const busyRef = useRef(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);

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
        setResult({
          status: "success",
          customerName: data.customerName,
          pointsAwarded: data.pointsAwarded,
          pointsBalance: data.pointsBalance,
        });
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
      <div className="overflow-hidden rounded-2xl bg-black">
        <video ref={videoRef} className="aspect-square w-full object-cover" muted playsInline />
      </div>

      {cameraError && (
        <p className="mt-4 text-sm text-red-600">
          {cameraError} Vérifiez que l&apos;accès à la caméra est autorisé pour ce site.
        </p>
      )}

      {result?.status === "success" && (
        <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4">
          <p className="font-medium text-green-800">
            +{result.pointsAwarded} points {result.customerName ? `pour ${result.customerName}` : ""}
          </p>
          <p className="text-sm text-green-700">Nouveau solde : {result.pointsBalance} points</p>
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
