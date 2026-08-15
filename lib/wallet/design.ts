import type { StampIconKey, SectorKey } from "@/lib/supabase/types";

// Column list shared by every query that needs a point of sale's own design
// overrides (see supabase/migrations/0024_pos_card_design.sql) — kept in one
// place so the Apple pass, the Google Wallet object, and the public card
// page can't drift out of sync by each hand-typing a slightly different
// select string.
export const POINT_OF_SALE_DESIGN_FIELDS =
  "brand_color, text_color, stamp_style, sector, logo_url, background_photo_url, background_photo_enabled, name_display_mode";

export const MERCHANT_DESIGN_FIELDS =
  "business_name, brand_color, text_color, stamp_style, sector, logo_url, background_photo_url, background_photo_enabled, name_display_mode";

export interface PointOfSaleDesignRow {
  brand_color: string | null;
  text_color: string | null;
  stamp_style: StampIconKey | null;
  sector: SectorKey | null;
  logo_url: string | null;
  background_photo_url: string | null;
  background_photo_enabled: boolean | null;
  name_display_mode: "text" | "logo" | null;
}

export interface MerchantDesignRow {
  business_name: string;
  brand_color: string;
  text_color: string | null;
  stamp_style: StampIconKey;
  sector: SectorKey | null;
  logo_url: string | null;
  background_photo_url: string | null;
  background_photo_enabled: boolean;
  name_display_mode: "text" | "logo";
}

export interface ResolvedCardDesign {
  brandColor: string;
  textColor: string | null;
  stampStyle: StampIconKey;
  sector: SectorKey | null;
  logoUrl: string | null;
  backgroundPhotoUrl: string | null;
  backgroundPhotoEnabled: boolean;
  nameDisplayMode: "text" | "logo";
}

// The single source of truth for "which design applies to this card" —
// every renderer (Apple pass, Google Wallet object, this public page) must
// go through this so a point of sale that hasn't customized a given field
// falls back to the merchant's own value the same way everywhere.
export function resolveCardDesign(
  pointOfSale: PointOfSaleDesignRow | null | undefined,
  merchant: MerchantDesignRow
): ResolvedCardDesign {
  return {
    brandColor: pointOfSale?.brand_color ?? merchant.brand_color,
    textColor: pointOfSale?.text_color ?? merchant.text_color,
    stampStyle: pointOfSale?.stamp_style ?? merchant.stamp_style,
    sector: pointOfSale?.sector ?? merchant.sector,
    logoUrl: pointOfSale?.logo_url ?? merchant.logo_url,
    backgroundPhotoUrl: pointOfSale?.background_photo_url ?? merchant.background_photo_url,
    backgroundPhotoEnabled: pointOfSale?.background_photo_enabled ?? merchant.background_photo_enabled,
    nameDisplayMode: pointOfSale?.name_display_mode ?? merchant.name_display_mode,
  };
}
