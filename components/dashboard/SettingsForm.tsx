"use client";

import { useActionState } from "react";
import { updateMerchantSettings, type SettingsActionState } from "@/lib/actions/settings";

const initialState: SettingsActionState = {};

export function SettingsForm({
  googleMapsLink,
  googleReviewLink,
  phone,
  address,
}: {
  googleMapsLink: string | null;
  googleReviewLink: string | null;
  phone: string | null;
  address: string | null;
}) {
  const [state, formAction, pending] = useActionState(updateMerchantSettings, initialState);

  return (
    <form action={formAction} className="max-w-md space-y-5">
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          Téléphone
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          placeholder="01 23 45 67 89"
          defaultValue={phone ?? ""}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
        <p className="mt-1.5 text-xs text-gray-500">
          Affiché sur votre page publique avec un bouton &quot;Nous appeler&quot;.
        </p>
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          Adresse
        </label>
        <input
          id="address"
          name="address"
          placeholder="12 rue de la Paix, 75002 Paris"
          defaultValue={address ?? ""}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="googleMapsLink" className="block text-sm font-medium text-gray-700">
          Lien Google Maps
        </label>
        <input
          id="googleMapsLink"
          name="googleMapsLink"
          type="url"
          placeholder="https://maps.app.goo.gl/..."
          defaultValue={googleMapsLink ?? ""}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
        <p className="mt-1.5 text-xs text-gray-500">
          Utilisé pour le bouton &quot;Itinéraire&quot; de votre page publique.
        </p>
      </div>

      <div>
        <label htmlFor="googleReviewLink" className="block text-sm font-medium text-gray-700">
          Lien avis Google
        </label>
        <input
          id="googleReviewLink"
          name="googleReviewLink"
          type="url"
          placeholder="https://g.page/r/.../review"
          defaultValue={googleReviewLink ?? ""}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
        <p className="mt-1.5 text-xs text-gray-500">
          Utilisé pour le bouton &quot;Laisser un avis&quot; et le message envoyé 10 minutes
          après chaque scan.
        </p>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-green-600">Paramètres enregistrés.</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {pending ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}
