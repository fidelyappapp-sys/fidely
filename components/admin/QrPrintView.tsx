"use client";

import { useState } from "react";

interface QrItem {
  label: string;
  qrDataUrl: string;
}

export function QrPrintView({ businessName, items }: { businessName: string; items: QrItem[] }) {
  const [format, setFormat] = useState<"card" | "a4">("card");

  return (
    <div>
      <style>{`
        @media print {
          .admin-chrome, .no-print { display: none !important; }
          body { padding: 0; margin: 0; }
        }
      `}</style>

      <div className="no-print mb-6 flex items-center gap-3">
        <div className="flex rounded-full border border-gray-200 p-1 text-sm">
          <button
            type="button"
            onClick={() => setFormat("card")}
            className={`rounded-full px-4 py-1.5 ${format === "card" ? "bg-gray-900 text-white" : "text-gray-600"}`}
          >
            Format carte
          </button>
          <button
            type="button"
            onClick={() => setFormat("a4")}
            className={`rounded-full px-4 py-1.5 ${format === "a4" ? "bg-gray-900 text-white" : "text-gray-600"}`}
          >
            Format A4
          </button>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-full bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          Imprimer / Enregistrer en PDF
        </button>
      </div>

      {format === "card" ? (
        <div className="flex flex-wrap gap-6">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex w-64 flex-col items-center rounded-2xl border border-gray-200 p-6 text-center"
            >
              <p className="text-sm font-semibold text-gray-900">{businessName}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.qrDataUrl} alt={item.label} width={180} height={180} className="mt-4" />
              <p className="mt-3 text-xs text-gray-500">{item.label}</p>
              <a
                href={item.qrDataUrl}
                download={`fidely-qr-${businessName}-${item.label}.png`}
                className="no-print mt-1 text-xs font-medium text-indigo-600 hover:text-indigo-500"
              >
                Télécharger
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-16">
          {items.map((item) => (
            <div key={item.label} className="flex flex-col items-center text-center">
              <p className="text-2xl font-semibold text-gray-900">{businessName}</p>
              <p className="mt-1 text-base text-gray-500">{item.label}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.qrDataUrl} alt={item.label} width={360} height={360} className="mt-6" />
              <a
                href={item.qrDataUrl}
                download={`fidely-qr-${businessName}-${item.label}.png`}
                className="no-print mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Télécharger
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
