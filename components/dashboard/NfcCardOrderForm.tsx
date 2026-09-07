"use client";

import { useState } from "react";
import {
  PLAQUE_DISCOUNT_BRACKETS,
  PLAQUE_PRO_SUBSCRIPTION_CENTS,
  PLAQUE_TIER_BASE_PRICE_CENTS,
  PLAQUE_TIER_LABELS,
  TIERED_NFC_SHIPPING_CENTS,
  TIERED_NFC_PRODUCT,
  plaqueUnitPriceCents,
} from "@/lib/boutique";
import type { PlaqueTier } from "@/lib/supabase/types";

type DeliveryMethod = "hand_delivery" | "postal_shipping";
type BillingInterval = "month" | "year";

function formatEuros(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",") + "€";
}

const TIER_DESCRIPTIONS: Record<PlaqueTier, string> = {
  avis: "Redirection directe vers votre lien d'avis Google, sans page intermédiaire.",
  presence: "Page Hub avec plusieurs onglets (menu, réseaux, avis, contact) — 3 modifications par mois.",
  pro: "Hub illimité, menu multilingue traduit automatiquement, tous les onglets — abonnement fixe par compte.",
};

export function NfcCardOrderForm({
  alreadyOwned,
  hasActivePlaqueSubscription,
}: {
  alreadyOwned: number;
  hasActivePlaqueSubscription: boolean;
}) {
  const [tier, setTier] = useState<PlaqueTier>("avis");
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("month");
  const [quantity, setQuantity] = useState(1);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("hand_delivery");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unitAmountCents = plaqueUnitPriceCents(tier, alreadyOwned, quantity);
  const subtotalCents = unitAmountCents * quantity;
  const shippingCents = deliveryMethod === "postal_shipping" ? TIERED_NFC_SHIPPING_CENTS : 0;
  const totalCents = subtotalCents + shippingCents;
  const needsBillingChoice = tier === "pro" && !hasActivePlaqueSubscription;

  async function submit(formData: FormData) {
    setPending(true);
    setError(null);

    const payload: Record<string, unknown> = { tier, quantity, deliveryMethod };
    if (needsBillingChoice) payload.billingInterval = billingInterval;
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
      <div className="grid gap-3 sm:grid-cols-3">
        {(Object.keys(PLAQUE_TIER_LABELS) as PlaqueTier[]).map((t) => (
          <label
            key={t}
            className={`cursor-pointer rounded-2xl border p-4 text-sm ${
              tier === t ? "border-gray-900 ring-1 ring-gray-900" : "border-gray-200"
            }`}
          >
            <input type="radio" name="tier" className="sr-only" checked={tier === t} onChange={() => setTier(t)} />
            <p className="font-semibold text-gray-900">{PLAQUE_TIER_LABELS[t]}</p>
            <p className="mt-1 text-gray-500">{TIER_DESCRIPTIONS[t]}</p>
          </label>
        ))}
      </div>

      {needsBillingChoice && (
        <div className="rounded-2xl border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-900">Abonnement Pro (en plus de la plaque)</p>
          <p className="mt-1 text-xs text-gray-500">
            Prix fixe par commerce, quel que soit le nombre de plaques Présence/Pro.
          </p>
          <div className="mt-3 flex gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                checked={billingInterval === "month"}
                onChange={() => setBillingInterval("month")}
              />
              {formatEuros(PLAQUE_PRO_SUBSCRIPTION_CENTS.month)}/mois
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                checked={billingInterval === "year"}
                onChange={() => setBillingInterval("year")}
              />
              {formatEuros(PLAQUE_PRO_SUBSCRIPTION_CENTS.year)}/an
            </label>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-medium text-gray-900">
              {TIERED_NFC_PRODUCT.label} — {PLAQUE_TIER_LABELS[tier]}
            </p>
            <p className="text-sm text-gray-500">
              {formatEuros(unitAmountCents)} / {TIERED_NFC_PRODUCT.unitNoun} au tarif actuel
              {alreadyOwned > 0 ? ` (${alreadyOwned} déjà possédée${alreadyOwned > 1 ? "s" : ""})` : ""}
            </p>
          </div>
          <input
            type="number"
            min={1}
            max={100}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
            className="w-16 rounded-lg border border-gray-300 px-2 py-1 text-center text-sm"
          />
        </div>

        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="text-left text-xs tracking-wide text-gray-400 uppercase">
              <th className="pb-2 font-medium">Total possédé</th>
              <th className="pb-2 font-medium">Prix / {TIERED_NFC_PRODUCT.unitNoun}</th>
            </tr>
          </thead>
          <tbody>
            {PLAQUE_DISCOUNT_BRACKETS.map((bracket) => {
              const totalAfterOrder = alreadyOwned + quantity;
              const isActive = totalAfterOrder >= bracket.minQty && totalAfterOrder <= bracket.maxQty;
              const label =
                bracket.maxQty === Infinity
                  ? `${bracket.minQty}+`
                  : bracket.minQty === bracket.maxQty
                    ? `${bracket.minQty}`
                    : `${bracket.minQty}–${bracket.maxQty}`;
              return (
                <tr key={bracket.minQty} className={isActive ? "font-semibold text-gray-900" : "text-gray-500"}>
                  <td className="py-1">{label} {TIERED_NFC_PRODUCT.unitNoun}{bracket.maxQty !== 1 ? "s" : ""}</td>
                  <td className="py-1">
                    {formatEuros(Math.round(PLAQUE_TIER_BASE_PRICE_CENTS[tier] * (1 - bracket.discountPct / 100)))}
                  </td>
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
              Installation offerte pour la première {TIERED_NFC_PRODUCT.unitNoun}. Les {TIERED_NFC_PRODUCT.unitNoun}s
              supplémentaires sont livrées avec leur mode d&apos;emploi.
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
              La Poste — {formatEuros(TIERED_NFC_SHIPPING_CENTS)}
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
            {quantity} {TIERED_NFC_PRODUCT.unitNoun}{quantity > 1 ? "s" : ""} × {formatEuros(unitAmountCents)}
          </span>
          <span>{formatEuros(subtotalCents)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Livraison</span>
          <span>{shippingCents > 0 ? formatEuros(shippingCents) : "Gratuite"}</span>
        </div>
        {needsBillingChoice && (
          <div className="flex justify-between text-gray-600">
            <span>Abonnement Pro</span>
            <span>
              {billingInterval === "month"
                ? `${formatEuros(PLAQUE_PRO_SUBSCRIPTION_CENTS.month)}/mois`
                : `${formatEuros(PLAQUE_PRO_SUBSCRIPTION_CENTS.year)}/an`}
            </span>
          </div>
        )}
        <div className="flex justify-between border-t border-gray-200 pt-1 font-semibold text-gray-900">
          <span>Total aujourd&apos;hui</span>
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
