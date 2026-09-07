import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, HubTabKey, OpeningHours, SocialPlatform } from "@/lib/supabase/types";

export interface MerchantPageExtras {
  phone: string | null;
  googleMapsLink: string | null;
  googleReviewLink: string | null;
  openingHours: OpeningHours;
}

const EMPTY_EXTRAS: MerchantPageExtras = {
  phone: null,
  googleMapsLink: null,
  googleReviewLink: null,
  openingHours: [],
};

// Columns added by migrations 0004_notifications.sql (google_maps_link) and
// 0005_merchant_page.sql (everything else here). Queried separately from the
// baseline merchant fields (business_name, brand_color, ...) so that a
// deploy that ships this code before those migrations have actually been
// run degrades to "no opening hours / phone / etc." instead of taking down
// the whole page — a single query mixing existing and not-yet-existing
// columns would otherwise fail entirely and return no data at all.
export async function getMerchantPageExtras(
  supabase: SupabaseClient<Database>,
  merchantId: string
): Promise<MerchantPageExtras> {
  const { data, error } = await supabase
    .from("merchants")
    .select("phone, google_maps_link, google_review_link, opening_hours")
    .eq("id", merchantId)
    .maybeSingle();

  if (error || !data) return EMPTY_EXTRAS;

  return {
    phone: data.phone,
    googleMapsLink: data.google_maps_link,
    googleReviewLink: data.google_review_link,
    openingHours: data.opening_hours ?? [],
  };
}

export interface MenuItemRow {
  id: string;
  name: string;
  description: string | null;
  price_cents: number | null;
  photo_url: string | null;
}

// Same "not-yet-migrated" tolerance as above: merchant_menu_items may not
// exist yet, so a failed query just means an empty menu, not a crash.
export async function getMerchantMenuItems(
  supabase: SupabaseClient<Database>,
  merchantId: string
): Promise<MenuItemRow[]> {
  const { data, error } = await supabase
    .from("merchant_menu_items")
    .select("id, name, description, price_cents, photo_url")
    .eq("merchant_id", merchantId)
    .order("position", { ascending: true });

  return error || !data ? [] : data;
}

export interface GalleryPhotoRow {
  id: string;
  url: string;
}

export async function getMerchantGalleryPhotos(
  supabase: SupabaseClient<Database>,
  merchantId: string
): Promise<GalleryPhotoRow[]> {
  const { data, error } = await supabase
    .from("merchant_gallery_photos")
    .select("id, url")
    .eq("merchant_id", merchantId)
    .order("position", { ascending: true });

  return error || !data ? [] : data;
}

export interface SocialLinkRow {
  id: string;
  platform: SocialPlatform;
  url: string;
}

// Same "not-yet-migrated" tolerance as the helpers above — only used by the
// Hub page/editor (0028_merchant_hub_config.sql).
export async function getMerchantSocialLinks(
  supabase: SupabaseClient<Database>,
  merchantId: string
): Promise<SocialLinkRow[]> {
  const { data, error } = await supabase
    .from("merchant_social_links")
    .select("id, platform, url")
    .eq("merchant_id", merchantId)
    .order("position", { ascending: true });

  return error || !data ? [] : data;
}

const DEFAULT_ENABLED_TABS: HubTabKey[] = ["menu", "avis", "contact"];

export async function getMerchantHubConfig(
  supabase: SupabaseClient<Database>,
  merchantId: string
): Promise<{ enabledTabs: HubTabKey[] }> {
  const { data, error } = await supabase
    .from("merchant_hub_config")
    .select("enabled_tabs")
    .eq("merchant_id", merchantId)
    .maybeSingle();

  return { enabledTabs: error || !data ? DEFAULT_ENABLED_TABS : data.enabled_tabs };
}
