import type { ShopOrderItem } from "@/lib/supabase/types";

export interface BoutiqueProduct {
  key: ShopOrderItem["key"];
  label: string;
  amountCents: number;
  priceEnvVar: string;
}

// Only ever ordered as a side effect of createAdditionalMerchant()
// (lib/actions/boutique.ts), never picked directly from a catalog — it
// always comes bundled with creating a new commerce.
export const NEW_SHOP_KIT_PRODUCT: BoutiqueProduct = {
  key: "new_shop_kit",
  label: "Pack nouveau commerce",
  amountCents: 1300,
  priceEnvVar: "STRIPE_PRICE_NEW_SHOP_KIT",
};

// The 2 NFC products sold from /boutique (dashboard) and, for the plaque,
// publicly from app/(marketing)/avis-google — priced by volume tier (the
// reached tier applies to every unit in the order, not just the ones past
// the threshold), so they can't be modeled as fixed-price Stripe Prices;
// priced dynamically at checkout via inline price_data instead (see
// app/api/boutique/nfc-checkout and app/api/public/nfc-checkout).
export const TIERED_NFC_PRODUCTS: { key: "nfc_card" | "nfc_loyalty_card"; label: string; unitNoun: string }[] = [
  { key: "nfc_card", label: "Plaque avis Google", unitNoun: "plaque" },
  { key: "nfc_loyalty_card", label: "Carte de fidélité NFC", unitNoun: "carte" },
];

export function findTieredNfcProduct(key: string) {
  return TIERED_NFC_PRODUCTS.find((p) => p.key === key);
}

export const TIERED_NFC_PRICE_TIERS: { minQty: number; maxQty: number; unitAmountCents: number }[] = [
  { minQty: 1, maxQty: 1, unitAmountCents: 3000 },
  { minQty: 2, maxQty: 3, unitAmountCents: 2800 },
  { minQty: 4, maxQty: 5, unitAmountCents: 2600 },
  { minQty: 6, maxQty: 9, unitAmountCents: 2400 },
  { minQty: 10, maxQty: Infinity, unitAmountCents: 2200 },
];

export const TIERED_NFC_SHIPPING_CENTS = 399;

export function tieredNfcUnitPriceCents(quantity: number): number {
  const tier = TIERED_NFC_PRICE_TIERS.find((t) => quantity >= t.minQty && quantity <= t.maxQty);
  return (tier ?? TIERED_NFC_PRICE_TIERS[TIERED_NFC_PRICE_TIERS.length - 1]).unitAmountCents;
}
