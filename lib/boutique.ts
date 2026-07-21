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
