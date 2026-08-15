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

// Plaque avis Google — sold from /boutique (dashboard) and publicly from
// app/(marketing)/avis-google — priced by volume tier (the reached tier
// applies to every unit in the order, not just the ones past the
// threshold), so it can't be modeled as a fixed-price Stripe Price; priced
// dynamically at checkout via inline price_data instead (see
// app/api/boutique/nfc-checkout and app/api/public/nfc-checkout).
export const TIERED_NFC_PRODUCT = { key: "nfc_card" as const, label: "Plaque avis Google", unitNoun: "plaque" };

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

// Individual replacement parts for the Plaque avis Google — flat prices, no
// volume tier (unlike the plaque itself above). "qr" and "nfc_chip" each get
// physically configured to one specific point of sale's loyalty program once
// received, so ordering either — standalone or via the pack, which bundles
// one of each — requires picking which point of sale it's for (see
// PlaqueComponentsOrderForm). display_stand/sheet are just generic hardware,
// nothing to configure, so they don't need that.
export const PLAQUE_COMPONENTS: {
  key: "display_stand" | "sheet" | "qr" | "nfc_chip";
  label: string;
  amountCents: number;
  needsPos: boolean;
}[] = [
  { key: "display_stand", label: "Présentoir en PVC", amountCents: 800, needsPos: false },
  { key: "sheet", label: "Feuille de présentation", amountCents: 300, needsPos: false },
  { key: "qr", label: "QR code", amountCents: 200, needsPos: true },
  { key: "nfc_chip", label: "Puce NFC connectée", amountCents: 200, needsPos: true },
];

// Cheaper than buying all 4 components separately (800+300+200+200=1500).
export const PLAQUE_FULL_KIT = {
  key: "full_kit" as const,
  label: "Pack complet (présentoir + feuille + QR code + puce NFC)",
  amountCents: 1300,
  needsPos: true,
};

export function findPlaqueComponent(key: string) {
  return PLAQUE_COMPONENTS.find((c) => c.key === key);
}
