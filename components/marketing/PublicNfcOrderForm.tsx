"use client";

import { useState } from "react";
import { TIERED_NFC_PRICE_TIERS, TIERED_NFC_SHIPPING_CENTS, tieredNfcUnitPriceCents } from "@/lib/boutique";

function formatEuros(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",") + "€";
}

// Anonymous purchase, no account needed — posts straight to
// /api/public/nfc-checkout (see that route's comment for why there's no
// delivery-method choice or address form here: always shipped, Stripe
// Checkout collects the address itself).
export function PublicNfcOrderForm() {
  const [quantity, setQuantity] = useState(1);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unitAmountCents = tieredNfcUnitPriceCents(quantity);
  const subtotalCents = unitAmountCents * quantity;
  const totalCents = subtotalCents + TIERED_NFC_SHIPPING_CENTS;

  async function handleBuy() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/public/nfc-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
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

  return (
    <div className="rounded-3xl border border-gray-100 p-8">
      <h2 className="font-semibold text-gray-900">Acheter directement</h2>
      <p className="mt-1 text-sm text-gray-600">
        Sans passer par une installation en personne — livré chez vous.
      </p>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-sm text-gray-700">Quantité</span>
        <input
          type="number"
          min={1}
          max={20}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
          className="w-16 rounded-lg border border-gray-300 px-2 py-1 text-center text-sm"
        />
      </div>

      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="text-left text-xs tracking-wide text-gray-400 uppercase">
            <th className="pb-2 font-medium">Quantité</th>
            <th className="pb-2 font-medium">Prix / plaque</th>
          </tr>
        </thead>
        <tbody>
          {TIERED_NFC_PRICE_TIERS.map((tier) => {
            const isActive = quantity >= tier.minQty && quantity <= tier.maxQty;
            const label =
              tier.maxQty === Infinity
                ? `${tier.minQty}+`
                : tier.minQty === tier.maxQty
                  ? `${tier.minQty}`
                  : `${tier.minQty}–${tier.maxQty}`;
            return (
              <tr key={tier.minQty} className={isActive ? "font-semibold text-gray-900" : "text-gray-500"}>
                <td className="py-1">
                  {label} plaque{tier.maxQty !== 1 ? "s" : ""}
                </td>
                <td className="py-1">{formatEuros(tier.unitAmountCents)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-4 space-y-1 rounded-2xl bg-gray-50 p-4 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>
            {quantity} plaque{quantity > 1 ? "s" : ""} × {formatEuros(unitAmountCents)}
          </span>
          <span>{formatEuros(subtotalCents)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Livraison</span>
          <span>{formatEuros(TIERED_NFC_SHIPPING_CENTS)}</span>
        </div>
        <div className="flex justify-between border-t border-gray-200 pt-1 font-semibold text-gray-900">
          <span>Total</span>
          <span>{formatEuros(totalCents)}</span>
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleBuy}
        disabled={pending}
        className="mt-6 block w-full rounded-full bg-indigo-600 px-6 py-3 text-center font-medium text-white transition hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-lg disabled:opacity-50"
      >
        {pending ? "Redirection..." : `Acheter maintenant — ${formatEuros(totalCents)}`}
      </button>
    </div>
  );
}
