import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, OpeningHours } from "@/lib/supabase/types";

export interface MerchantPageExtras {
  phone: string | null;
  address: string | null;
  googleMapsLink: string | null;
  googleReviewLink: string | null;
  openingHours: OpeningHours;
}

const EMPTY_EXTRAS: MerchantPageExtras = {
  phone: null,
  address: null,
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
    .select("phone, address, google_maps_link, google_review_link, opening_hours")
    .eq("id", merchantId)
    .maybeSingle();

  if (error || !data) return EMPTY_EXTRAS;

  return {
    phone: data.phone,
    address: data.address,
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
