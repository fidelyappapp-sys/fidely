import Stripe from "stripe";

let stripeSingleton: Stripe | null = null;

// Lazily constructed so importing this module never throws when Stripe
// hasn't been configured yet (e.g. during early local dev / Phase 0-3).
export function stripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-06-24.dahlia",
    });
  }
  return stripeSingleton;
}
