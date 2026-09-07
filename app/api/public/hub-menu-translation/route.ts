import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getMerchantMenuItems } from "@/lib/merchantPageContent";
import { getTranslatedMenuItems, HUB_MENU_LOCALES } from "@/lib/i18n/translateMenu";
import { getEffectiveHubTier } from "@/lib/hub/modifications";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";

const schema = z.object({ code: z.string().min(1), locale: z.enum(HUB_MENU_LOCALES) });

// On-demand translation for the Hub menu tab's language switcher (Pro tier
// only) — translating every locale eagerly on every scan would be wasteful
// (most visitors read the default French menu), so this is fetched lazily
// only when a visitor actually picks another language.
export async function POST(request: Request) {
  const { allowed } = await checkRateLimit({ bucketKey: `hub_menu_translation:${clientIp(request)}`, limit: 60, windowSeconds: 60 });
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });

  const db = createServiceRoleClient();
  const { data: plaque } = await db.from("plaques").select("tier, merchant_id").eq("short_code", parsed.data.code).maybeSingle();
  if (!plaque?.merchant_id || plaque.tier === "avis") {
    return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  }

  const effectiveTier = await getEffectiveHubTier(plaque.merchant_id);
  if (effectiveTier !== "pro") {
    return NextResponse.json({ error: "Traduction réservée au palier Pro." }, { status: 403 });
  }

  const menuItems = await getMerchantMenuItems(db, plaque.merchant_id);
  const translated = await getTranslatedMenuItems(menuItems, parsed.data.locale);
  return NextResponse.json({ items: translated });
}
