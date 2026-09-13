"use client";

import { useState } from "react";
import type { PlaqueMenuConfig, StandalonePlaqueTabKey } from "@/lib/supabase/types";

const TAB_LABELS: Record<StandalonePlaqueTabKey, string> = {
  accueil: "Accueil",
  avis: "Avis Google",
  menu: "Menu",
  offres: "Offres",
  fidelite: "Fidélité",
};

// Renders a plaque that has no linked merchant account (see
// supabase/migrations/0034_j_code_import.sql) — content comes straight from
// plaques.merchant_name/merchant_address/menu_config instead of the
// merchants/merchant_hub_config tables HubTabs reads from.
export function StandaloneHubTabs({
  merchantName,
  merchantAddress,
  googleReviewUrl,
  menuConfig,
  showLoyaltyTab,
}: {
  merchantName: string | null;
  merchantAddress: string | null;
  googleReviewUrl: string | null;
  menuConfig: PlaqueMenuConfig | null;
  showLoyaltyTab: boolean;
}) {
  const enabledTabs = menuConfig?.enabledTabs?.length ? menuConfig.enabledTabs : (["accueil", "avis"] as const);
  const tabs = enabledTabs.filter((tab) => tab !== "fidelite" || showLoyaltyTab);
  const [activeTab, setActiveTab] = useState<StandalonePlaqueTabKey | null>(tabs[0] ?? null);

  if (tabs.length === 0) {
    return <p className="text-center text-sm text-gray-500">Cette page n&apos;est pas encore configurée.</p>;
  }

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto rounded-full bg-gray-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
              activeTab === tab ? "bg-white text-gray-900 shadow" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === "accueil" && (
          <div className="text-center">
            {merchantAddress && <p className="text-sm text-gray-600">{merchantAddress}</p>}
            {!merchantAddress && <p className="text-sm text-gray-500">Adresse non renseignée.</p>}
          </div>
        )}

        {activeTab === "avis" && (
          <div className="text-center">
            {googleReviewUrl ? (
              <a
                href={googleReviewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-500"
              >
                Laisser un avis Google
              </a>
            ) : (
              <p className="text-sm text-gray-500">Lien d&apos;avis non configuré.</p>
            )}
          </div>
        )}

        {activeTab === "menu" && (
          <div className="space-y-3">
            {(menuConfig?.menuItems ?? []).map((item, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 p-3">
                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                {item.description && <p className="text-sm text-gray-600">{item.description}</p>}
                {typeof item.priceCents === "number" && (
                  <p className="text-sm text-gray-500">{(item.priceCents / 100).toFixed(2)} €</p>
                )}
              </div>
            ))}
            {(!menuConfig?.menuItems || menuConfig.menuItems.length === 0) && (
              <p className="text-sm text-gray-500">Menu à venir.</p>
            )}
          </div>
        )}

        {activeTab === "offres" && (
          <div className="space-y-2">
            {(menuConfig?.offers ?? []).map((offer, i) => (
              <p key={i} className="rounded-2xl border border-gray-100 p-3 text-sm text-gray-900">
                {offer}
              </p>
            ))}
            {(!menuConfig?.offers || menuConfig.offers.length === 0) && (
              <p className="text-sm text-gray-500">Aucune offre pour le moment.</p>
            )}
          </div>
        )}

        {activeTab === "fidelite" && (
          <p className="text-center text-sm text-gray-500">Programme de fidélité bientôt disponible ici.</p>
        )}
      </div>

      {merchantName && <p className="mt-8 text-center text-xs text-gray-400">{merchantName}</p>}
    </div>
  );
}
