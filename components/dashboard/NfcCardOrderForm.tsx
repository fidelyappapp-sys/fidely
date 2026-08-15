"use client";

import { useState } from "react";
import { NFC_CARD_PRICE_TIERS, NFC_CARD_SHIPPING_CENTS, nfcCardUnitPriceCents } from "@/lib/boutique";

type DeliveryMethod = "hand_delivery" | "postal_shipping";

function formatEuros(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",") + "€";
}

export function NfcCardOrderForm() {
  const [quantity, setQuantity] = useState(1);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("hand_delivery");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unitAmountCents = nfcCardUnitPriceCents(quantity);
  const cardsSubtotalCents = unitAmountCents * quantity;
  const shippingCents = deliveryMethod === "postal_shipping" ? NFC_CARD_SHIPPING_CENTS : 0;
  const totalCents = cardsSubtotalCents + shippingCents;

  async function submit(formData: FormData) {
    setPending(true);
    setError(null);

    const payload: Record<string, unknown> = { quantity, deliveryMethod };
    if (deliveryMethod === "postal_shipping") {
      payload.shippingName = formData.get("shippingName");
      payload.shippingLine1 = formData.get("shippingLine1");
      payload.shippingLine2 = formData.get("shippingLine2");
      payload.shippingPostalCode = formData.get("shippingPostalCode");
      payload.shippingCity = formData.get("shippingCity");
      payload.shippingCountry = formData.get("shippingCountry") || "France";
    }

    try {
      const res = await fetch("/api/boutique/nfc-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
    <form action={submit} className="max-w-lg space-y-6">
      <div className="rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-medium text-gray-900">Carte NFC</p>
            <p className="text-sm text-gray-500">
              {formatEuros(unitAmountCents)} / carte au tarif actuel
            </p>
          </div>
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
              <th className="pb-2 font-medium">Prix / carte</th>
            </tr>
          </thead>
          <tbody>
            {NFC_CARD_PRICE_TIERS.map((tier) => {
              const isActive = quantity >= tier.minQty && quantity <= tier.maxQty;
              const label = tier.maxQty === Infinity ? `${tier.minQty}+` : tier.minQty === tier.maxQty ? `${tier.minQty}` : `${tier.minQty}–${tier.maxQty}`;
              return (
                <tr
                  key={tier.minQty}
                  className={isActive ? "font-semibold text-gray-900" : "text-gray-500"}
                >
                  <td className="py-1">{label} carte{tier.maxQty !== 1 ? "s" : ""}</td>
                  <td className="py-1">{formatEuros(tier.unitAmountCents)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-3">
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-gray-200 p-4">
          <input
            type="radio"
            name="deliveryMethod"
            checked={deliveryMethod === "hand_delivery"}
            onChange={() => setDeliveryMethod("hand_delivery")}
            className="mt-1"
          />
          <div>
            <p className="font-medium text-gray-900">Remise en main propre — gratuite</p>
            <p className="text-sm text-gray-500">
              Installation offerte pour la première carte. Les cartes supplémentaires sont livrées
              avec leur mode d&apos;emploi.
            </p>
          </div>
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-gray-200 p-4">
          <input
            type="radio"
            name="deliveryMethod"
            checked={deliveryMethod === "postal_shipping"}
            onChange={() => setDeliveryMethod("postal_shipping")}
            className="mt-1"
          />
          <div>
            <p className="font-medium text-gray-900">
              La Poste — {formatEuros(NFC_CARD_SHIPPING_CENTS)}
            </p>
          </div>
        </label>
      </div>

      {deliveryMethod === "postal_shipping" && (
        <div className="grid gap-3 rounded-2xl border border-gray-100 p-4 sm:grid-cols-2">
          <input
            name="shippingName"
            placeholder="Nom du destinataire"
            required
            className="col-span-2 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          />
          <input
            name="shippingLine1"
            placeholder="Adresse"
            required
            className="col-span-2 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          />
          <input
            name="shippingLine2"
            placeholder="Complément (optionnel)"
            className="col-span-2 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          />
          <input
            name="shippingPostalCode"
            placeholder="Code postal"
            required
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          />
          <input
            name="shippingCity"
            placeholder="Ville"
            required
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          />
          <input
            name="shippingCountry"
            placeholder="Pays"
            defaultValue="France"
            className="col-span-2 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          />
        </div>
      )}

      <div className="space-y-1 rounded-2xl bg-gray-50 p-4 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>
            {quantity} carte{quantity > 1 ? "s" : ""} × {formatEuros(unitAmountCents)}
          </span>
          <span>{formatEuros(cardsSubtotalCents)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Livraison</span>
          <span>{shippingCents > 0 ? formatEuros(shippingCents) : "Gratuite"}</span>
        </div>
        <div className="flex justify-between border-t border-gray-200 pt-1 font-semibold text-gray-900">
          <span>Total</span>
          <span>{formatEuros(totalCents)}</span>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {pending ? "Redirection..." : `Payer ${formatEuros(totalCents)}`}
      </button>
    </form>
  );
}
