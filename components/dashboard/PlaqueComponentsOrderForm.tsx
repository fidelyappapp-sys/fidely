"use client";

import { useState } from "react";
import Link from "next/link";
import { PLAQUE_COMPONENTS, PLAQUE_FULL_KIT } from "@/lib/boutique";

interface PosOption {
  id: string;
  label: string;
  city: string | null;
}

type PosKey = "qr" | "nfc_chip" | "full_kit";

function formatEuros(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",") + "€";
}

// Resizes a per-unit point-of-sale assignment array to match a new
// quantity — growing appends a default slot (pre-filled only when the
// merchant has exactly one point of sale), shrinking drops from the end so
// earlier picks are never disturbed by an unrelated quantity change.
function resizePosSlots(current: string[], quantity: number, defaultPosId: string): string[] {
  if (quantity <= current.length) return current.slice(0, quantity);
  return [...current, ...Array(quantity - current.length).fill(defaultPosId)];
}

export function PlaqueComponentsOrderForm({ pointsOfSale }: { pointsOfSale: PosOption[] }) {
  const defaultPosId = pointsOfSale.length === 1 ? pointsOfSale[0].id : "";

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [fullKitQty, setFullKitQty] = useState(0);
  const [posSlots, setPosSlots] = useState<Record<PosKey, string[]>>({ qr: [], nfc_chip: [], full_kit: [] });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setComponentQty(key: string, needsPos: boolean, qty: number) {
    const clamped = Math.max(0, Math.min(20, qty));
    setQuantities((q) => ({ ...q, [key]: clamped }));
    if (needsPos) {
      setPosSlots((slots) => ({ ...slots, [key]: resizePosSlots(slots[key as PosKey], clamped, defaultPosId) }));
    }
  }

  function setFullKitQuantity(qty: number) {
    const clamped = Math.max(0, Math.min(20, qty));
    setFullKitQty(clamped);
    setPosSlots((slots) => ({ ...slots, full_kit: resizePosSlots(slots.full_kit, clamped, defaultPosId) }));
  }

  function setPosSlot(key: PosKey, index: number, posId: string) {
    setPosSlots((slots) => {
      const next = [...slots[key]];
      next[index] = posId;
      return { ...slots, [key]: next };
    });
  }

  const totalCents =
    PLAQUE_COMPONENTS.reduce((sum, c) => sum + (quantities[c.key] ?? 0) * c.amountCents, 0) +
    fullKitQty * PLAQUE_FULL_KIT.amountCents;

  const needsPosButNoPos =
    pointsOfSale.length === 0 &&
    ((quantities.qr ?? 0) > 0 || (quantities.nfc_chip ?? 0) > 0 || fullKitQty > 0);

  const allPosSlotsFilled =
    posSlots.qr.every(Boolean) && posSlots.nfc_chip.every(Boolean) && posSlots.full_kit.every(Boolean);

  const hasAnyItem = totalCents > 0;
  const canSubmit = hasAnyItem && !needsPosButNoPos && allPosSlotsFilled;

  async function handleBuy() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/boutique/components-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayStandQty: quantities.display_stand ?? 0,
          sheetQty: quantities.sheet ?? 0,
          qrQty: quantities.qr ?? 0,
          qrPosIds: posSlots.qr,
          nfcChipQty: quantities.nfc_chip ?? 0,
          nfcChipPosIds: posSlots.nfc_chip,
          fullKitQty,
          fullKitPosIds: posSlots.full_kit,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? "Une erreur est survenue.");
        setPending(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Erreur réseau, réessayez.");
      setPending(false);
    }
  }

  function PosSelects({ posKey, label }: { posKey: PosKey; label: string }) {
    if (posSlots[posKey].length === 0) return null;
    return (
      <div className="mt-2 space-y-2 rounded-xl bg-gray-50 p-3">
        <p className="text-xs font-medium text-gray-600">
          Point de vente — {label} ({posSlots[posKey].length})
        </p>
        {posSlots[posKey].map((value, i) => (
          <select
            key={i}
            value={value}
            onChange={(e) => setPosSlot(posKey, i, e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          >
            <option value="">
              {label} {i + 1} — choisir un point de vente
            </option>
            {pointsOfSale.map((pos) => (
              <option key={pos.id} value={pos.id}>
                {pos.label}
                {pos.city ? ` (${pos.city})` : ""}
              </option>
            ))}
          </select>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="rounded-2xl border border-gray-200 p-4">
        <p className="font-medium text-gray-900">Composants & pièces détachées</p>
        <p className="mt-0.5 text-xs text-gray-500">
          À l&apos;unité, ou en pack complet à prix réduit.
        </p>

        <div className="mt-4 space-y-3">
          {PLAQUE_COMPONENTS.map((component) => (
            <div key={component.key}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={component.imageUrl}
                    alt={component.label}
                    className="h-14 w-14 shrink-0 rounded-lg border border-gray-100 object-cover"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{component.label}</p>
                    <p className="text-xs text-gray-500">{formatEuros(component.amountCents)} / unité</p>
                  </div>
                </div>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={quantities[component.key] ?? 0}
                  onChange={(e) => setComponentQty(component.key, component.needsPos, Number(e.target.value) || 0)}
                  className="w-16 rounded-lg border border-gray-300 px-2 py-1 text-center text-sm"
                />
              </div>
              {component.needsPos && (
                <PosSelects posKey={component.key as PosKey} label={component.label} />
              )}
            </div>
          ))}

          <div className="border-t border-gray-100 pt-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={PLAQUE_FULL_KIT.imageUrl}
                  alt={PLAQUE_FULL_KIT.label}
                  className="h-14 w-14 shrink-0 rounded-lg border border-gray-100 object-cover"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">{PLAQUE_FULL_KIT.label}</p>
                  <p className="text-xs text-gray-500">
                    {formatEuros(PLAQUE_FULL_KIT.amountCents)} / pack — moins cher qu&apos;à la carte
                  </p>
                </div>
              </div>
              <input
                type="number"
                min={0}
                max={20}
                value={fullKitQty}
                onChange={(e) => setFullKitQuantity(Number(e.target.value) || 0)}
                className="w-16 rounded-lg border border-gray-300 px-2 py-1 text-center text-sm"
              />
            </div>
            <PosSelects posKey="full_kit" label={PLAQUE_FULL_KIT.label} />
          </div>
        </div>
      </div>

      {needsPosButNoPos && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Vous n&apos;avez encore aucun point de vente — un QR code ou une puce NFC doit être rattaché à
          un point de vente pour pouvoir être configuré à la réception.{" "}
          <Link href="/dashboard/qr-codes" className="font-medium underline">
            Créer un point de vente
          </Link>
        </p>
      )}

      <div className="space-y-1 rounded-2xl bg-gray-50 p-4 text-sm">
        <div className="flex justify-between border-t border-gray-200 pt-1 font-semibold text-gray-900">
          <span>Total</span>
          <span>{formatEuros(totalCents)}</span>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleBuy}
        disabled={pending || !canSubmit}
        className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {pending ? "Redirection..." : `Payer ${formatEuros(totalCents)}`}
      </button>
    </div>
  );
}
