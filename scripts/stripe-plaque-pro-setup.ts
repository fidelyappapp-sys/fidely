// One-off setup script: creates the recurring Stripe Product/Prices for the
// Plaque "Pro" subscription (separate from the metered core subscription
// created by stripe-setup.ts, and from the one-time boutique Products
// created by stripe-boutique-setup.ts).
//
// Usage:
//   STRIPE_SECRET_KEY=sk_test_... npm run stripe:plaque-pro-setup
//
// Prints the resulting price ids — copy them into STRIPE_PRICE_PLAQUE_PRO_MONTHLY
// / STRIPE_PRICE_PLAQUE_PRO_ANNUAL in your .env.

import Stripe from "stripe";

async function main() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Set STRIPE_SECRET_KEY before running this script");
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2026-06-24.dahlia" });

  console.log("Creating Fidély Plaque — Abonnement Pro...");
  const product = await stripe.products.create({ name: "Fidély Plaque — Abonnement Pro" });

  const monthly = await stripe.prices.create({
    product: product.id,
    currency: "eur",
    unit_amount: 699,
    recurring: { interval: "month" },
  });
  console.log(`  monthly price: ${monthly.id}`);

  const annual = await stripe.prices.create({
    product: product.id,
    currency: "eur",
    unit_amount: 5499,
    recurring: { interval: "year" },
  });
  console.log(`  annual price: ${annual.id}`);

  console.log("\nDone. Set the following in your .env:");
  console.log(`STRIPE_PRICE_PLAQUE_PRO_MONTHLY=${monthly.id}`);
  console.log(`STRIPE_PRICE_PLAQUE_PRO_ANNUAL=${annual.id}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
