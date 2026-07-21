import { createServiceRoleClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { isStripeConfigured } from "@/lib/env";

type Db = ReturnType<typeof createServiceRoleClient>;

export interface SubscriptionCounts {
  active: number;
  paused: number;
  canceled: number;
  other: number;
}

export async function getSubscriptionCounts(db: Db): Promise<SubscriptionCounts> {
  const { data } = await db.from("merchants").select("subscription_status");
  const counts: SubscriptionCounts = { active: 0, paused: 0, canceled: 0, other: 0 };
  for (const row of data ?? []) {
    if (row.subscription_status === "active") counts.active++;
    else if (row.subscription_status === "paused") counts.paused++;
    else if (row.subscription_status === "canceled") counts.canceled++;
    else counts.other++;
  }
  return counts;
}

// Sums actually-paid Stripe invoices within [start, end) — reflects real
// billed revenue rather than the scans*0.10 estimate shown to merchants.
export async function getRevenueForRange(start: Date, end: Date): Promise<number | null> {
  if (!isStripeConfigured) return null;

  let totalCents = 0;
  let startingAfter: string | undefined;

  do {
    const page = await stripe().invoices.list({
      created: { gte: Math.floor(start.getTime() / 1000), lt: Math.floor(end.getTime() / 1000) },
      limit: 100,
      starting_after: startingAfter,
    });
    for (const invoice of page.data) {
      if (invoice.status === "paid") totalCents += invoice.amount_paid;
    }
    startingAfter = page.has_more ? page.data[page.data.length - 1]?.id : undefined;
  } while (startingAfter);

  return totalCents / 100;
}

export interface AdminMerchantRow {
  id: string;
  businessName: string;
  slug: string;
  subscriptionStatus: string;
  createdAt: string;
  scanCount: number;
  estimatedBillThisMonth: number;
}

export async function getMerchantsList(db: Db): Promise<AdminMerchantRow[]> {
  const { data: merchants } = await db
    .from("merchants")
    .select("id, business_name, slug, subscription_status, created_at")
    .order("created_at", { ascending: false });

  if (!merchants || merchants.length === 0) return [];

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: scans } = await db
    .from("scan_events")
    .select("merchant_id")
    .gte("created_at", startOfMonth.toISOString());

  const scanCounts = new Map<string, number>();
  for (const row of scans ?? []) {
    scanCounts.set(row.merchant_id, (scanCounts.get(row.merchant_id) ?? 0) + 1);
  }

  return merchants.map((m) => {
    const scanCount = scanCounts.get(m.id) ?? 0;
    return {
      id: m.id,
      businessName: m.business_name,
      slug: m.slug,
      subscriptionStatus: m.subscription_status,
      createdAt: m.created_at,
      scanCount,
      estimatedBillThisMonth: Math.max(30, scanCount * 0.1),
    };
  });
}

export interface PendingKitOrder {
  id: string;
  businessName: string;
  createdAt: string;
  deliveryMethod: string | null;
  shippingAddress: unknown;
}

export async function getPendingKitOrders(db: Db): Promise<PendingKitOrder[]> {
  const { data } = await db
    .from("merchants")
    .select("id, business_name, created_at, kit_delivery_method, kit_shipping_address, kit_delivery_status")
    .in("kit_delivery_status", ["pending", "processing"])
    .order("created_at", { ascending: true });

  return (data ?? []).map((m) => ({
    id: m.id,
    businessName: m.business_name,
    createdAt: m.created_at,
    deliveryMethod: m.kit_delivery_method,
    shippingAddress: m.kit_shipping_address,
  }));
}

export interface MonthlySubscriberPoint {
  label: string;
  count: number;
}

// Approximates "active subscribers at the end of each of the last 12
// months" from signup date + cancellation date. Doesn't account for pauses
// or past_due dips within a month — a full status-change log would be
// needed for that — but is honest about being a trend, not a ledger.
export async function getSubscriberTrend(db: Db): Promise<MonthlySubscriberPoint[]> {
  const { data } = await db.from("merchants").select("created_at, subscription_canceled_at");
  const merchants = data ?? [];

  const points: MonthlySubscriberPoint[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEndExclusive = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const count = merchants.filter((m) => {
      const createdAt = new Date(m.created_at);
      if (createdAt >= monthEndExclusive) return false;
      if (!m.subscription_canceled_at) return true;
      return new Date(m.subscription_canceled_at) >= monthEndExclusive;
    }).length;
    const label = monthStart
      .toLocaleDateString("fr-FR", { month: "short", year: "2-digit" })
      .replace(".", "");
    points.push({ label, count });
  }
  return points;
}

export interface AdminAlerts {
  pastDue: { id: string; businessName: string }[];
  pauseEndingSoon: { id: string; businessName: string; pauseEndsAt: string }[];
}

export async function getAdminAlerts(db: Db): Promise<AdminAlerts> {
  const { data: pastDueRows } = await db
    .from("merchants")
    .select("id, business_name")
    .eq("subscription_status", "past_due");

  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: pauseRows } = await db
    .from("merchants")
    .select("id, business_name, subscription_pause_ends_at")
    .eq("subscription_status", "paused")
    .lte("subscription_pause_ends_at", sevenDaysFromNow);

  return {
    pastDue: (pastDueRows ?? []).map((m) => ({ id: m.id, businessName: m.business_name })),
    pauseEndingSoon: (pauseRows ?? []).map((m) => ({
      id: m.id,
      businessName: m.business_name,
      pauseEndsAt: m.subscription_pause_ends_at as string,
    })),
  };
}
