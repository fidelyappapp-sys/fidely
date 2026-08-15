import type { ShopOrderItem } from "@/lib/supabase/types";

export interface BoutiqueProduct {
  key: ShopOrderItem["key"];
  label: string;
  amountCents: number;
  priceEnvVar: string;
}

// The 4 items a merchant can add to their cart from /boutique. "new_shop_kit"
// is deliberately excluded — it's only ever ordered as a side effect of
// createAdditionalMerchant() (lib/actions/boutique.ts), never picked
// directly, since it always comes bundled with creating a new commerce.
export const BOUTIQUE_PRODUCTS: BoutiqueProduct[] = [
  { key: "display_stand", label: "Présentoir plastique seul", amountCents: 1000, priceEnvVar: "STRIPE_PRICE_DISPLAY_STAND" },
  { key: "sheet", label: "Feuille A5 plastifiée seule", amountCents: 300, priceEnvVar: "STRIPE_PRICE_SHEET" },
  { key: "qr", label: "QR code imprimé seul", amountCents: 200, priceEnvVar: "STRIPE_PRICE_QR" },
  { key: "full_kit", label: "Pack complet (présentoir + feuille + QR)", amountCents: 1300, priceEnvVar: "STRIPE_PRICE_FULL_KIT" },
];

export const NEW_SHOP_KIT_PRODUCT: BoutiqueProduct = {
  key: "new_shop_kit",
  label: "Pack nouveau commerce",
  amountCents: 1300,
  priceEnvVar: "STRIPE_PRICE_NEW_SHOP_KIT",
};

export function findBoutiqueProduct(key: string): BoutiqueProduct | undefined {
  return [...BOUTIQUE_PRODUCTS, NEW_SHOP_KIT_PRODUCT].find((p) => p.key === key);
}

// Plaque avis Google (NFC + QR code, see app/(marketing)/avis-google): priced
// by volume tier (the reached tier applies to every unit in the order, not
// just the ones past the threshold), so it can't be modeled as a single
// fixed-price Stripe Price like BOUTIQUE_PRODUCTS above — priced dynamically
// at checkout via inline price_data instead (see
// app/api/boutique/nfc-checkout/route.ts).
export const NFC_CARD_PRICE_TIERS: { minQty: number; maxQty: number; unitAmountCents: number }[] = [
  { minQty: 1, maxQty: 1, unitAmountCents: 3000 },
  { minQty: 2, maxQty: 3, unitAmountCents: 2800 },
  { minQty: 4, maxQty: 5, unitAmountCents: 2600 },
  { minQty: 6, maxQty: 9, unitAmountCents: 2400 },
  { minQty: 10, maxQty: Infinity, unitAmountCents: 2200 },
];

export const NFC_CARD_SHIPPING_CENTS = 399;

export function nfcCardUnitPriceCents(quantity: number): number {
  const tier = NFC_CARD_PRICE_TIERS.find((t) => quantity >= t.minQty && quantity <= t.maxQty);
  return (tier ?? NFC_CARD_PRICE_TIERS[NFC_CARD_PRICE_TIERS.length - 1]).unitAmountCents;
}
