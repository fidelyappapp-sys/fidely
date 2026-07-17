"use client";

import { useActionState, useState } from "react";
import { chooseKitDelivery, type KitDeliveryActionState } from "@/lib/actions/kitDelivery";
import type { KitDeliveryMethod } from "@/lib/supabase/types";

const initialState: KitDeliveryActionState = {};

const OPTIONS: { value: KitDeliveryMethod; title: string; description: string; price: string }[] = [
  {
    value: "hand_delivery",
    title: "Je suis présent avec le commerçant",
    description:
      "Livraison en main propre gratuite — installation du présentoir et impression du QR code sur place.",
    price: "Gratuit",
  },
  {
    value: "express_shipping",
    title: "Je ne suis pas présent",
    description: "Envoi postal, prélevé immédiatement sur la carte enregistrée.",
    price: "3,99€",
  },
  {
    value: "standard_shipping",
    title: "Envoi postal standard",
    description: "Livré par courrier sans frais supplémentaires, dans un délai plus long.",
    price: "Gratuit",
  },
];

export function KitDeliveryForm() {
  const [state, formAction, pending] = useActionState(chooseKitDelivery, initialState);
  const [method, setMethod] = useState<KitDeliveryMethod>("hand_delivery");
  const needsAddress = method !== "hand_delivery";

  return (
    <form action={formAction} className="max-w-lg space-y-6">
      <div className="space-y-3">
        {OPTIONS.map((option) => (
          <label
            key={option.value}
            className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
              method === option.value
                ? "border-gray-900 ring-1 ring-gray-900"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <input
              type="radio"
              name="method"
              value={option.value}
              checked={method === option.value}
              onChange={() => setMethod(option.value)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-gray-900">{option.title}</p>
                <span className="shrink-0 text-sm font-semibold text-gray-900">
                  {option.price}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600">{option.description}</p>
            </div>
          </label>
        ))}
      </div>

      {needsAddress && (
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

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && (
        <p className="text-sm text-green-600">Choix enregistré, merci !</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {pending
          ? "Envoi..."
          : method === "express_shipping"
            ? "Confirmer et payer 3,99€"
            : "Confirmer"}
      </button>
    </form>
  );
}
