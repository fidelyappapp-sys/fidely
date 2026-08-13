"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { addQrCode, addJoinSourceQrCode, deleteQrCode, type QrCodeActionState } from "@/lib/actions/qrCodes";

interface QrCodeItem {
  id: string;
  label: string;
  targetUrl: string;
  qrDataUrl: string;
}

const initialState: QrCodeActionState = {};

export function QrCodeManager({
  items,
  kind,
}: {
  items: QrCodeItem[];
  kind: "custom" | "join_source";
}) {
  const router = useRouter();
  const [addState, addAction, addPending] = useActionState(
    kind === "join_source" ? addJoinSourceQrCode : addQrCode,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (addState.success) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [addState.success, router]);

  return (
    <div className="max-w-2xl">
      {items.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-gray-100 p-5 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.qrDataUrl} alt={item.label} width={160} height={160} className="mx-auto" />
              <p className="mt-3 font-medium text-gray-900">{item.label}</p>
              <p className="mt-1 truncate text-xs text-gray-500">{item.targetUrl}</p>
              <div className="mt-3 flex items-center justify-center gap-4">
                <a
                  href={item.qrDataUrl}
                  download={`fidely-qr-${item.label.toLowerCase().replace(/\s+/g, "-")}.png`}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Télécharger
                </a>
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

      <form
        ref={formRef}
        action={addAction}
        className="mt-4 space-y-3 rounded-xl border border-dashed border-gray-300 p-4"
      >
        <p className="text-sm font-medium text-gray-900">Créer un QR code</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            name="label"
            placeholder={kind === "join_source" ? "Nom (ex: Boutique Bastille)" : "Nom (ex: Happy Hour)"}
            required
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          />
          {kind === "custom" && (
            <input
              name="targetUrl"
              type="url"
              placeholder="https://..."
              required
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            />
          )}
        </div>
        {kind === "join_source" && (
          <p className="text-xs text-gray-500">
            Ce nom identifie le point de vente ou l&apos;offre — il sera associé à chaque carte créée via ce QR.
          </p>
        )}
        {addState.error && <p className="text-sm text-red-600">{addState.error}</p>}
        <button
          type="submit"
          disabled={addPending}
          className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {addPending ? "Création..." : "Créer"}
        </button>
      </form>
    </div>
  );
}
