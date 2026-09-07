"use client";

import { useState } from "react";
import { MenuSection } from "@/components/public-card/MenuSection";
import { OpeningHoursList } from "@/components/public-card/OpeningHoursList";
import { HUB_TAB_CATALOG } from "@/lib/hub/tabs";
import { HUB_MENU_LOCALES, type HubMenuLocale } from "@/lib/i18n/locales";
import type { EffectiveHubTier } from "@/lib/hub/modifications";
import type { HubTabKey, OpeningHours, SocialPlatform } from "@/lib/supabase/types";

const LOCALE_LABELS: Record<"fr" | HubMenuLocale, string> = {
  fr: "Français",
  en: "English",
  es: "Español",
  de: "Deutsch",
  it: "Italiano",
};

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price_cents: number | null;
  photo_url: string | null;
}

interface SocialLink {
  id: string;
  platform: SocialPlatform;
  url: string;
}

const SOCIAL_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  website: "Site web",
  other: "Lien",
};

export function HubTabs({
  plaqueCode,
  enabledTabs,
  effectiveTier,
  translationAvailable,
  menuItems,
  openingHours,
  phone,
  googleReviewLink,
  socialLinks,
}: {
  plaqueCode: string;
  enabledTabs: HubTabKey[];
  effectiveTier: EffectiveHubTier;
  translationAvailable: boolean;
  menuItems: MenuItem[];
  openingHours: OpeningHours;
  phone: string | null;
  googleReviewLink: string | null;
  socialLinks: SocialLink[];
}) {
  const tabs = HUB_TAB_CATALOG.filter((t) => enabledTabs.includes(t.key));
  const [activeTab, setActiveTab] = useState<HubTabKey | null>(tabs[0]?.key ?? null);
  const [locale, setLocale] = useState<"fr" | HubMenuLocale>("fr");
  const [translatedMenuItems, setTranslatedMenuItems] = useState<MenuItem[] | null>(null);
  const [translating, setTranslating] = useState(false);

  const canTranslate = effectiveTier === "pro" && translationAvailable;
  const displayedMenuItems = locale === "fr" ? menuItems : (translatedMenuItems ?? menuItems);

  async function handleLocaleChange(next: "fr" | HubMenuLocale) {
    setLocale(next);
    if (next === "fr") return;
    setTranslating(true);
    try {
      const res = await fetch("/api/public/hub-menu-translation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: plaqueCode, locale: next }),
      });
      const data = await res.json();
      if (res.ok) setTranslatedMenuItems(data.items);
    } catch {
      // Best-effort — displayedMenuItems falls back to the French source.
    } finally {
      setTranslating(false);
    }
  }

  if (tabs.length === 0) {
    return <p className="text-center text-sm text-gray-500">Cette page n&apos;est pas encore configurée.</p>;
  }

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto rounded-full bg-gray-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.key ? "bg-white text-gray-900 shadow" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === "menu" && (
          <div>
            {canTranslate && menuItems.length > 0 && (
              <div className="mb-3 flex items-center gap-2">
                <select
                  value={locale}
                  onChange={(e) => handleLocaleChange(e.target.value as "fr" | HubMenuLocale)}
                  className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
                >
                  <option value="fr">{LOCALE_LABELS.fr}</option>
                  {HUB_MENU_LOCALES.map((l) => (
                    <option key={l} value={l}>
                      {LOCALE_LABELS[l]}
                    </option>
                  ))}
                </select>
                {translating && <span className="text-xs text-gray-400">Traduction...</span>}
              </div>
            )}
            <MenuSection items={displayedMenuItems} />
            {menuItems.length === 0 && <p className="text-sm text-gray-500">Menu à venir.</p>}
          </div>
        )}

        {activeTab === "avis" && (
          <div className="text-center">
            {googleReviewLink ? (
              <a
                href={googleReviewLink}
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

        {activeTab === "social" && (
          <div className="space-y-2">
            {socialLinks.length === 0 && <p className="text-sm text-gray-500">Aucun réseau social pour le moment.</p>}
            {socialLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-2xl border border-gray-100 p-3 text-sm font-medium text-gray-900 hover:border-gray-200"
              >
                {SOCIAL_LABELS[link.platform]}
              </a>
            ))}
          </div>
        )}

        {activeTab === "contact" && (
          <div className="space-y-4">
            {phone && <p className="text-sm text-gray-700">📞 {phone}</p>}
            <OpeningHoursList hours={openingHours} />
          </div>
        )}
      </div>
    </div>
  );
}
