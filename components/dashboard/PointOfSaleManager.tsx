"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteQrCode, createPointOfSale, type QrCodeActionState } from "@/lib/actions/qrCodes";
import { ProgramForm } from "@/components/dashboard/ProgramForm";

interface PointOfSaleItem {
  id: string;
  label: string;
  city: string | null;
  qrDataUrl: string;
}

const initialState: QrCodeActionState = {};

const blankProgram = {
  name: "",
  display_mode: "stamps" as const,
  points_per_scan: 1,
  stamp_count: 10,
  points_per_euro: null,
  reward_threshold: 10,
  reward_description: "",
};

export function PointOfSaleManager({ items }: { items: PointOfSaleItem[] }) {
  const router = useRouter();

  return (
    <div className="max-w-2xl">
      {items.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-gray-100 p-5 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.qrDataUrl} alt={item.label} width={160} height={160} className="mx-auto" />
              <p className="mt-3 font-medium text-gray-900">{item.label}</p>
              <p className="mt-1 text-xs text-gray-500">{item.city || "Ville non renseignée"}</p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-4">
                <a
                  href={item.qrDataUrl}
                  download={`fidely-qr-${item.label.toLowerCase().replace(/\s+/g, "-")}.png`}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Télécharger
                </a>
                <Link
                  href={`/dashboard/program?pos=${item.id}`}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Programme
                </Link>
                <form
                  action={async (formData) => {
                    await deleteQrCode(initialState, formData);
                    router.refresh();
                  }}
                >
                  <input type="hidden" name="id" value={item.id} />
                  <button type="submit" className="text-xs font-medium text-red-600 hover:text-red-700">
                    Supprimer
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 rounded-xl border border-dashed border-gray-300 p-4">
        <p className="text-sm font-medium text-gray-900">Créer un point de vente</p>
        <p className="mt-1 text-xs text-gray-500">
          Même comportement d&apos;inscription que le QR &quot;Rejoindre&quot;, avec son propre programme de
          fidélité (comme à la création de votre compte).
        </p>
        <div className="mt-3">
          <ProgramForm
            program={blankProgram}
            action={createPointOfSale}
            submitLabel="Créer le point de vente"
            extraFields={
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="label" className="block text-sm font-medium text-gray-700">
                    Nom
                  </label>
                  <input
                    id="label"
                    name="label"
                    placeholder="Boutique Bastille"
                    required
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    Ville
                  </label>
                  <input
                    id="city"
                    name="city"
                    placeholder="Paris"
                    required
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                  />
                </div>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}
