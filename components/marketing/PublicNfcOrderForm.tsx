"use client";

import { useState } from "react";
import { PLAQUE_DISCOUNT_BRACKETS, TIERED_NFC_SHIPPING_CENTS, plaqueUnitPriceCents } from "@/lib/boutique";

function formatEuros(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",") + "€";
}

// Anonymous purchase, Avis tier only (Présence/Pro require an account — see
// their CTAs on app/(marketing)/avis-google). Posts to
// /api/public/nfc-checkout. Email is required (in addition to the review
// link) so the lifetime-cumulative degressive price can be computed
// correctly and so the edit-link email has somewhere to go.
export function PublicNfcOrderForm() {
  const [quantity, setQuantity] = useState(1);
  const [email, setEmail] = useState("");
  const [googleReviewLink, setGoogleReviewLink] = useState("");
  const [alreadyOwned, setAlreadyOwned] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unitAmountCents = plaqueUnitPriceCents("avis", alreadyOwned, quantity);
  const subtotalCents = unitAmountCents * quantity;
  const totalCents = subtotalCents + TIERED_NFC_SHIPPING_CENTS;

  async function refreshOwnedCount(candidateEmail: string) {
    if (!candidateEmail || !candidateEmail.includes("@")) return;
    try {
      const res = await fetch("/api/public/plaque-owned-count", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: candidateEmail }),
      });
      const data = await res.json();
      if (res.ok && typeof data.ownedCount === "number") setAlreadyOwned(data.ownedCount);
    } catch {
      // Best-effort only — the checkout route recomputes the real price server-side.
    }
  }

  async function handleBuy() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/public/nfc-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity, buyerEmail: email, googleReviewLink }),
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

      <div className="mt-4 space-y-3">
        <input
          type="url"
          required
          placeholder="Lien de votre fiche Google (avis)"
          value={googleReviewLink}
          onChange={(e) => setGoogleReviewLink(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
        <input
          type="email"
          required
          placeholder="Votre email (confirmation de commande + lien de modification)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={(e) => refreshOwnedCount(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-sm text-gray-700">Quantité</span>
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
            <th className="pb-2 font-medium">Prix / plaque</th>
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
                <td className="py-1">
                  {label} plaque{bracket.maxQty !== 1 ? "s" : ""}
                </td>
                <td className="py-1">{formatEuros(plaqueUnitPriceCents("avis", 0, bracket.minQty))}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {alreadyOwned > 0 && (
        <p className="mt-2 text-xs text-gray-500">
          Vous possédez déjà {alreadyOwned} plaque{alreadyOwned > 1 ? "s" : ""} — la remise tient compte du cumul.
        </p>
      )}

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
        disabled={pending || !email || !googleReviewLink}
        className="mt-6 block w-full rounded-full bg-indigo-600 px-6 py-3 text-center font-medium text-white transition hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-lg disabled:opacity-50"
      >
        {pending ? "Redirection..." : `Acheter maintenant — ${formatEuros(totalCents)}`}
      </button>
    </div>
  );
}
