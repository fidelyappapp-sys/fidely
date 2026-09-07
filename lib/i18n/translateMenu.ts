import { createServiceRoleClient } from "@/lib/supabase/server";
import { isTranslationConfigured } from "@/lib/env";
import type { MenuItemRow } from "@/lib/merchantPageContent";
import { HUB_MENU_LOCALES, type HubMenuLocale } from "@/lib/i18n/locales";

export { HUB_MENU_LOCALES };
export type { HubMenuLocale };

export interface TranslatedMenuItem {
  id: string;
  name: string;
  description: string | null;
  price_cents: number | null;
  photo_url: string | null;
}

const DEEPL_TARGET_LANG: Record<HubMenuLocale, string> = { en: "EN", es: "ES", de: "DE", it: "IT" };

async function translateWithDeepL(texts: string[], locale: HubMenuLocale): Promise<string[]> {
  const apiUrl = process.env.DEEPL_API_URL ?? "https://api-free.deepl.com/v2/translate";
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: { Authorization: `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ text: texts, target_lang: DEEPL_TARGET_LANG[locale], source_lang: "FR" }),
  });
  if (!res.ok) throw new Error(`DeepL error ${res.status}`);
  const data = (await res.json()) as { translations: { text: string }[] };
  return data.translations.map((t) => t.text);
}

// Translates the given menu items into `locale`, caching results in
// merchant_menu_translations (invalidated whenever the source item is
// re-saved via publishHubConfig, since that deletes+reinserts menu item
// rows with fresh ids). Falls back to the French source silently on any
// error — a broken/misconfigured translation should never break the menu.
export async function getTranslatedMenuItems(items: MenuItemRow[], locale: HubMenuLocale): Promise<TranslatedMenuItem[]> {
  if (!isTranslationConfigured || items.length === 0) return items;

  const db = createServiceRoleClient();
  const { data: cached } = await db
    .from("merchant_menu_translations")
    .select("menu_item_id, translated_name, translated_description")
    .eq("locale", locale)
    .in(
      "menu_item_id",
      items.map((i) => i.id)
    );

  const cacheByItemId = new Map((cached ?? []).map((row) => [row.menu_item_id, row]));
  const missing = items.filter((i) => !cacheByItemId.has(i.id));

  if (missing.length > 0) {
    try {
      const texts = missing.flatMap((i) => [i.name, i.description ?? ""]);
      const translated = await translateWithDeepL(texts, locale);
      const rows = missing.map((item, index) => ({
        menu_item_id: item.id,
        locale,
        translated_name: translated[index * 2] || item.name,
        translated_description: item.description ? translated[index * 2 + 1] || item.description : null,
      }));
      await db.from("merchant_menu_translations").upsert(rows);
      for (const row of rows) cacheByItemId.set(row.menu_item_id, row);
    } catch (err) {
      console.error("[translateMenu] DeepL translation failed, falling back to French", err);
    }
  }

  return items.map((item) => {
    const translation = cacheByItemId.get(item.id);
    return {
      id: item.id,
      name: translation?.translated_name ?? item.name,
      description: translation?.translated_description ?? item.description,
      price_cents: item.price_cents,
      photo_url: item.photo_url,
    };
  });
}
