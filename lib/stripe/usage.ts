import { stripe } from "./client";

export const SCAN_METER_EVENT_NAME = "loyalty_scan";

// Reports one scan as usage against the merchant's metered subscription.
// `identifier` should be the scan_events.id so retries are naturally
// idempotent (Stripe dedupes meter events by identifier).
export async function reportScanUsage(params: {
  stripeCustomerId: string;
  identifier: string;
}): Promise<{ id: string }> {
  const event = await stripe().billing.meterEvents.create({
    event_name: SCAN_METER_EVENT_NAME,
    identifier: params.identifier,
    payload: {
      stripe_customer_id: params.stripeCustomerId,
      value: "1",
    },
  });
  return { id: event.identifier ?? params.identifier };
}
