"use client";

import { useActionState, useState } from "react";
import { publishHubConfig, type HubActionState } from "@/lib/actions/hub";
import { HUB_TAB_CATALOG } from "@/lib/hub/tabs";
import { DAY_LABELS } from "@/lib/openingHours";
import type { HubModificationStatus } from "@/lib/hub/modifications";
import type { HubTabKey, OpeningHours, SocialPlatform, WeekDay } from "@/lib/supabase/types";

const DAY_ORDER: WeekDay[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const SOCIAL_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "tiktok", "website", "other"];

interface MenuItemDraft {
  id?: string;
  name: string;
  description: string;
  priceCents: number | null;
}
interface SocialLinkDraft {
  id?: string;
  platform: SocialPlatform;
  url: string;
}
interface HubDraft {
  enabledTabs: HubTabKey[];
  googleReviewLink: string;
  phone: string;
  openingHours: OpeningHours;
  menuItems: MenuItemDraft[];
  socialLinks: SocialLinkDraft[];
}

function normalizeOpeningHours(hours: OpeningHours): OpeningHours {
  return DAY_ORDER.map((day) => hours.find((h) => h.day === day) ?? { day, closed: true, open: "09:00", close: "18:00" });
}

const initialState: HubActionState = {};

export function HubEditor({ initial, modificationStatus }: { initial: HubDraft; modificationStatus: HubModificationStatus }) {
  const [draft, setDraft] = useState<HubDraft>({ ...initial, openingHours: normalizeOpeningHours(initial.openingHours) });
  const [state, formAction, pending] = useActionState(publishHubConfig, initialState);

  const quotaReached = modificationStatus.remaining === 0;

  function toggleTab(key: HubTabKey) {
    setDraft((d) => ({
      ...d,
      enabledTabs: d.enabledTabs.includes(key) ? d.enabledTabs.filter((t) => t !== key) : [...d.enabledTabs, key],
    }));
  }

  function updateMenuItem(index: number, patch: Partial<MenuItemDraft>) {
    setDraft((d) => ({ ...d, menuItems: d.menuItems.map((m, i) => (i === index ? { ...m, ...patch } : m)) }));
  }

  function updateSocialLink(index: number, patch: Partial<SocialLinkDraft>) {
    setDraft((d) => ({ ...d, socialLinks: d.socialLinks.map((s, i) => (i === index ? { ...s, ...patch } : s)) }));
  }

  function updateDay(day: WeekDay, patch: Partial<OpeningHours[number]>) {
    setDraft((d) => ({ ...d, openingHours: d.openingHours.map((h) => (h.day === day ? { ...h, ...patch } : h)) }));
  }

  return (
    <form action={formAction} className="mt-6 space-y-8">
      <input type="hidden" name="payload" value={JSON.stringify(draft)} />

      <div className="rounded-2xl border border-gray-200 p-4 text-sm">
        {modificationStatus.remaining === null ? (
          <p className="font-medium text-gray-900">Modifications illimitées (palier Pro).</p>
        ) : (
          <p className={`font-medium ${quotaReached ? "text-red-600" : "text-gray-900"}`}>
            {modificationStatus.remaining} modification{modificationStatus.remaining !== 1 ? "s" : ""} restante
            {modificationStatus.remaining !== 1 ? "s" : ""} ce mois-ci — réinitialisation le 1er du mois prochain.
          </p>
        )}
      </div>

      <section>
        <h2 className="text-sm font-semibold tracking-wide text-gray-500 uppercase">Onglets affichés</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {HUB_TAB_CATALOG.map((tab) => (
            <label
              key={tab.key}
              className={`cursor-pointer rounded-full border px-4 py-2 text-sm ${
                draft.enabledTabs.includes(tab.key) ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 text-gray-700"
              }`}
            >
              <input type="checkbox" className="sr-only" checked={draft.enabledTabs.includes(tab.key)} onChange={() => toggleTab(tab.key)} />
              {tab.label}
            </label>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold tracking-wide text-gray-500 uppercase">Contact & avis</h2>
        <div className="mt-3 space-y-3">
          <input
            type="url"
            placeholder="Lien de votre fiche avis Google"
            value={draft.googleReviewLink}
            onChange={(e) => setDraft((d) => ({ ...d, googleReviewLink: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          />
          <input
            type="tel"
            placeholder="Téléphone"
            value={draft.phone}
            onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold tracking-wide text-gray-500 uppercase">Horaires</h2>
        <div className="mt-3 divide-y divide-gray-100 rounded-2xl border border-gray-100">
          {draft.openingHours.map((entry) => (
            <div key={entry.day} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <span className="w-24 shrink-0 text-gray-700">{DAY_LABELS[entry.day]}</span>
              <label className="flex items-center gap-1.5 text-xs text-gray-500">
                <input type="checkbox" checked={entry.closed} onChange={(e) => updateDay(entry.day, { closed: e.target.checked })} />
                Fermé
              </label>
              {!entry.closed && (
                <>
                  <input
                    type="time"
                    value={entry.open}
                    onChange={(e) => updateDay(entry.day, { open: e.target.value })}
                    className="rounded border border-gray-300 px-2 py-1 text-xs"
                  />
                  <span>–</span>
                  <input
                    type="time"
                    value={entry.close}
                    onChange={(e) => updateDay(entry.day, { close: e.target.value })}
                    className="rounded border border-gray-300 px-2 py-1 text-xs"
                  />
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wide text-gray-500 uppercase">Menu</h2>
          <button
            type="button"
            onClick={() => setDraft((d) => ({ ...d, menuItems: [...d.menuItems, { name: "", description: "", priceCents: null }] }))}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            + Ajouter un article
          </button>
        </div>
        <div className="mt-3 space-y-3">
          {draft.menuItems.map((item, index) => (
            <div key={item.id ?? index} className="grid gap-2 rounded-2xl border border-gray-100 p-3 sm:grid-cols-[2fr_3fr_1fr_auto]">
              <input
                placeholder="Nom"
                value={item.name}
                onChange={(e) => updateMenuItem(index, { name: e.target.value })}
                className="rounded border border-gray-300 px-2 py-1.5 text-sm"
              />
              <input
                placeholder="Description"
                value={item.description}
                onChange={(e) => updateMenuItem(index, { description: e.target.value })}
                className="rounded border border-gray-300 px-2 py-1.5 text-sm"
              />
              <input
                type="number"
                placeholder="Prix (€)"
                value={item.priceCents != null ? item.priceCents / 100 : ""}
                onChange={(e) => updateMenuItem(index, { priceCents: e.target.value ? Math.round(Number(e.target.value) * 100) : null })}
                className="rounded border border-gray-300 px-2 py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={() => setDraft((d) => ({ ...d, menuItems: d.menuItems.filter((_, i) => i !== index) }))}
                className="text-sm text-red-600 hover:text-red-500"
              >
                Retirer
              </button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wide text-gray-500 uppercase">Réseaux sociaux</h2>
          <button
            type="button"
            onClick={() => setDraft((d) => ({ ...d, socialLinks: [...d.socialLinks, { platform: "instagram", url: "" }] }))}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            + Ajouter un lien
          </button>
        </div>
        <div className="mt-3 space-y-3">
          {draft.socialLinks.map((link, index) => (
            <div key={link.id ?? index} className="grid gap-2 rounded-2xl border border-gray-100 p-3 sm:grid-cols-[1fr_3fr_auto]">
              <select
                value={link.platform}
                onChange={(e) => updateSocialLink(index, { platform: e.target.value as SocialPlatform })}
                className="rounded border border-gray-300 px-2 py-1.5 text-sm"
              >
                {SOCIAL_PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <input
                type="url"
                placeholder="https://..."
                value={link.url}
                onChange={(e) => updateSocialLink(index, { url: e.target.value })}
                className="rounded border border-gray-300 px-2 py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={() => setDraft((d) => ({ ...d, socialLinks: d.socialLinks.filter((_, i) => i !== index) }))}
                className="text-sm text-red-600 hover:text-red-500"
              >
                Retirer
              </button>
            </div>
          ))}
        </div>
      </section>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-green-600">Page Hub publiée.</p>}

      <button
        type="submit"
        disabled={pending || quotaReached}
        className="rounded-full bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {pending ? "Publication..." : "Publier"}
      </button>
    </form>
  );
}
