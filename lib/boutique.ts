import type { PlaqueTier, ShopOrderItem } from "@/lib/supabase/types";

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

// Plaque avis Google — sold from /boutique (dashboard, all 3 tiers) and
// publicly from app/(marketing)/avis-google (Avis tier only) — priced by
// volume bracket (the reached bracket applies to every unit ever owned, not
// just the ones past the threshold), so it can't be modeled as a
// fixed-price Stripe Price; priced dynamically at checkout via inline
// price_data instead (see app/api/boutique/nfc-checkout and
// app/api/public/nfc-checkout).
export const TIERED_NFC_PRODUCT = { key: "nfc_card" as const, label: "Plaque avis Google", unitNoun: "plaque" };

export const TIERED_NFC_SHIPPING_CENTS = 399;

export const PLAQUE_TIER_LABELS: Record<PlaqueTier, string> = {
  avis: "Avis",
  presence: "Présence",
  pro: "Pro",
};

export const PLAQUE_TIER_BASE_PRICE_CENTS: Record<PlaqueTier, number> = {
  avis: 3000,
  presence: 4000,
  pro: 4000,
};

export const PLAQUE_PRO_SUBSCRIPTION_CENTS = { month: 699, year: 5499 };

// Applies uniformly to whichever base price (Avis: 30€, Présence/Pro: 40€)
// the order is for — the discount schedule is independent of the
// subscription price, which stays fixed regardless of quantity.
export const PLAQUE_DISCOUNT_BRACKETS: { minQty: number; maxQty: number; discountPct: number }[] = [
  { minQty: 1, maxQty: 1, discountPct: 0 },
  { minQty: 2, maxQty: 2, discountPct: 10 },
  { minQty: 3, maxQty: 4, discountPct: 15 },
  { minQty: 5, maxQty: 9, discountPct: 20 },
  { minQty: 10, maxQty: 19, discountPct: 30 },
  { minQty: 20, maxQty: 39, discountPct: 40 },
  { minQty: 40, maxQty: Infinity, discountPct: 50 },
];

// Lifetime cumulative discount: the bracket reached by (already owned + new
// quantity) applies to every unit of THIS order, never retroactively to
// units already invoiced in past orders.
export function plaqueUnitPriceCents(tier: PlaqueTier, alreadyOwned: number, newQuantity: number): number {
  const totalAfterOrder = alreadyOwned + newQuantity;
  const bracket =
    PLAQUE_DISCOUNT_BRACKETS.find((b) => totalAfterOrder >= b.minQty && totalAfterOrder <= b.maxQty) ??
    PLAQUE_DISCOUNT_BRACKETS[PLAQUE_DISCOUNT_BRACKETS.length - 1];
  return Math.round(PLAQUE_TIER_BASE_PRICE_CENTS[tier] * (1 - bracket.discountPct / 100));
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
  imageUrl: string;
}[] = [
  { key: "display_stand", label: "Présentoir en PVC", amountCents: 800, needsPos: false, imageUrl: "/boutique/presentoir.jpg" },
  { key: "sheet", label: "Feuille de présentation", amountCents: 300, needsPos: false, imageUrl: "/boutique/feuille.jpg" },
  { key: "qr", label: "QR code", amountCents: 200, needsPos: true, imageUrl: "/boutique/qr-code.jpg" },
  { key: "nfc_chip", label: "Puce NFC connectée", amountCents: 200, needsPos: true, imageUrl: "/boutique/puce-nfc.jpg" },
];

// Cheaper than buying all 4 components separately (800+300+200+200=1500).
export const PLAQUE_FULL_KIT = {
  key: "full_kit" as const,
  label: "Pack complet (présentoir + feuille + QR code + puce NFC)",
  amountCents: 1300,
  needsPos: true,
  imageUrl: "/boutique/pack-complet.jpg",
};

export function findPlaqueComponent(key: string) {
  return PLAQUE_COMPONENTS.find((c) => c.key === key);
}
