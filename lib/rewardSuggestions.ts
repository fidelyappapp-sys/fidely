import type { SectorKey } from "@/lib/supabase/types";

// Quick-pick reward suggestions shown next to the free-text field on the
// program step (onboarding step 3 and Paramètres → Programme) — tailored to
// the merchant's sector (set on the personalisation step) so the default
// suggestions actually make sense for what they sell.
const SUGGESTIONS_BY_SECTOR: Record<SectorKey, string[]> = {
  cafe: ["1 café offert", "1 boisson offerte"],
  bar: ["1 café offert", "1 boisson offerte"],
  restaurant: ["1 dessert offert", "-10% sur l'addition"],
  bakery: ["1 viennoiserie offerte", "1 baguette offerte"],
  hairdresser: ["1 coupe offerte", "-20% sur une prestation"],
  gym: ["1 séance offerte", "1 mois offert"],
  beauty_spa: ["1 soin offert", "-20% sur une prestation"],
  // Stand-in for "Boutique" (no dedicated sector in the picker yet) — generic
  // enough wording ("un article", "votre achat") to fit most small retail.
  bookstore: ["-10% sur un article", "-15€ sur votre achat"],
  food_truck: ["1 menu offert", "1 boisson offerte"],
  dry_cleaning: ["1 article nettoyé offert", "-5€ sur votre commande"],
  garage: ["1 vidange offerte", "-10€ sur votre facture"],
  florist: ["1 bouquet offert", "-5€ sur votre commande"],
  pet_shop: ["1 toilettage offert", "-5€ sur votre commande"],
  pharmacy: ["1 produit offert", "-10% sur votre prochain achat"],
  cinema: ["1 place offerte", "1 pop-corn offert"],
};

const DEFAULT_SUGGESTIONS = ["10% de réduction", "-5€ sur votre commande", "1 cadeau offert"];

export function getRewardSuggestions(sector: SectorKey | null): string[] {
  if (!sector) return DEFAULT_SUGGESTIONS;
  return SUGGESTIONS_BY_SECTOR[sector] ?? DEFAULT_SUGGESTIONS;
}
