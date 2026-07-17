// One-off setup script: creates the Stripe Billing Meter, Product and the
// single graduated-tiered metered Price used for every Fidély subscription
// (0,10€/scan, 30€/month minimum — see docs/STRIPE_SETUP.md for the math).
//
// Usage:
//   STRIPE_SECRET_KEY=sk_test_... npm run stripe:setup
//
// Prints the resulting price id — copy it into STRIPE_METERED_PRICE_ID.

import Stripe from "stripe";

async function main() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Set STRIPE_SECRET_KEY before running this script");
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2026-06-24.dahlia" });

  console.log("Creating billing meter...");
  const meter = await stripe.billing.meters.create({
    display_name: "Fidély scans",
    event_name: "loyalty_scan",
    default_aggregation: { formula: "sum" },
    customer_mapping: { event_payload_key: "stripe_customer_id", type: "by_id" },
    value_settings: { event_payload_key: "value" },
  });
  console.log(`  meter: ${meter.id}`);

  console.log("Creating product...");
  const product = await stripe.products.create({
    name: "Fidély — Abonnement",
    description: "0,10€ par scan, minimum 30€/mois. Toutes les fonctionnalités incluses.",
  });
  console.log(`  product: ${product.id}`);

  console.log("Creating graduated-tiered metered price...");
  // interval: day/30 (not "month") — the product spec calls for a bill
  // every 30 days exactly, not a calendar month (which varies 28-31 days).
  const price = await stripe.prices.create({
    product: product.id,
    currency: "eur",
    recurring: { usage_type: "metered", meter: meter.id, interval: "day", interval_count: 30 },
    billing_scheme: "tiered",
    tiers_mode: "graduated",
    tiers: [
      { up_to: 300, flat_amount: 3000, unit_amount: 0 },
      { up_to: "inf", unit_amount: 10 },
    ],
  });
  console.log(`  price: ${price.id}`);

  console.log("\nDone. Set the following in your .env:");
  console.log(`STRIPE_METERED_PRICE_ID=${price.id}`);
  console.log(
    "\nBefore going live: validate this price in test mode by subscribing a test\n" +
      "customer, firing meter events above/below 300 in one billing period, and\n" +
      "confirming the invoice equals max(30€, 0,10€ × scans). If the flat_amount\n" +
      "tier doesn't combine with the meter as expected, use the two-price fallback\n" +
      "documented in docs/STRIPE_SETUP.md."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
