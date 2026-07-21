// One-off setup script: creates the one-time Stripe Products/Prices for the
// /boutique replacement-kit shop (separate from the metered subscription
// price created by stripe-setup.ts).
//
// Usage:
//   STRIPE_SECRET_KEY=sk_test_... npm run stripe:boutique-setup
//
// Prints the resulting price ids — copy them into the STRIPE_PRICE_* env vars.

import Stripe from "stripe";

const PRODUCTS = [
  { key: "STRIPE_PRICE_DISPLAY_STAND", name: "Présentoir plastique", amountCents: 1000 },
  { key: "STRIPE_PRICE_SHEET", name: "Feuille A5 plastifiée", amountCents: 300 },
  { key: "STRIPE_PRICE_QR", name: "QR code imprimé", amountCents: 200 },
  { key: "STRIPE_PRICE_FULL_KIT", name: "Pack complet (présentoir + feuille + QR)", amountCents: 1300 },
  { key: "STRIPE_PRICE_NEW_SHOP_KIT", name: "Pack nouveau commerce", amountCents: 1300 },
] as const;

async function main() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Set STRIPE_SECRET_KEY before running this script");
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2026-06-24.dahlia" });
  const results: string[] = [];

  for (const item of PRODUCTS) {
    console.log(`Creating ${item.name}...`);
    const product = await stripe.products.create({ name: item.name });
    const price = await stripe.prices.create({
      product: product.id,
      currency: "eur",
      unit_amount: item.amountCents,
    });
    console.log(`  price: ${price.id}`);
    results.push(`${item.key}=${price.id}`);
  }

  console.log("\nDone. Set the following in your .env:");
  for (const line of results) console.log(line);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
