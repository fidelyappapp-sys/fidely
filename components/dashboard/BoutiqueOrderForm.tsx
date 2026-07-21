"use client";

import { useState } from "react";
import { BOUTIQUE_PRODUCTS } from "@/lib/boutique";

type DeliveryMethod = "hand_delivery" | "postal_shipping";

export function BoutiqueOrderForm() {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("hand_delivery");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalCents = BOUTIQUE_PRODUCTS.reduce(
    (sum, p) => sum + (quantities[p.key] ?? 0) * p.amountCents,
    0
  );

  async function submit(formData: FormData) {
    setPending(true);
    setError(null);

    const items = BOUTIQUE_PRODUCTS.filter((p) => (quantities[p.key] ?? 0) > 0).map((p) => ({
      key: p.key,
      quantity: quantities[p.key],
    }));

    if (items.length === 0) {
      setError("Sélectionnez au moins un produit.");
      setPending(false);
      return;
    }

    const payload: Record<string, unknown> = { items, deliveryMethod };
    if (deliveryMethod === "postal_shipping") {
      payload.shippingName = formData.get("shippingName");
      payload.shippingLine1 = formData.get("shippingLine1");
      payload.shippingLine2 = formData.get("shippingLine2");
      payload.shippingPostalCode = formData.get("shippingPostalCode");
      payload.shippingCity = formData.get("shippingCity");
      payload.shippingCountry = formData.get("shippingCountry") || "France";
    }

    try {
      const res = await fetch("/api/boutique/checkout", {
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
      <div className="space-y-3">
        {BOUTIQUE_PRODUCTS.map((product) => (
          <div
            key={product.key}
            className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 p-4"
          >
            <div>
              <p className="font-medium text-gray-900">{product.label}</p>
              <p className="text-sm text-gray-500">{(product.amountCents / 100).toFixed(2)}€</p>
            </div>
            <input
              type="number"
              min={0}
              max={20}
              value={quantities[product.key] ?? 0}
              onChange={(e) =>
                setQuantities((q) => ({ ...q, [product.key]: Math.max(0, Number(e.target.value)) }))
              }
              className="w-16 rounded-lg border border-gray-300 px-2 py-1 text-center text-sm"
            />
          </div>
        ))}
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
            <p className="font-medium text-gray-900">Remise en main propre — gratuite si disponible</p>
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
            <p className="font-medium text-gray-900">La Poste — incluse dans le prix</p>
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

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending || totalCents === 0}
        className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {pending ? "Redirection..." : `Payer ${(totalCents / 100).toFixed(2)}€`}
      </button>
    </form>
  );
}
