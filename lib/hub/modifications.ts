import { createServiceRoleClient } from "@/lib/supabase/server";

export const HUB_MONTHLY_MODIFICATION_LIMIT = 3;

export type EffectiveHubTier = "presence" | "pro";

export interface HubModificationStatus {
  effectiveTier: EffectiveHubTier;
  usedThisMonth: number;
  remaining: number | null; // null = unlimited (Pro)
}

// Derives the account's current hub capability from its live Pro
// subscription state — NOT from the tier a given plaque was originally sold
// as. One shared Hub per merchant: an active Pro subscription unlocks every
// presence/pro plaque under that merchant, and a lapsed one downgrades all
// of them back to Présence capability (3 modifs/month) rather than
// blocking access — see supabase/migrations/0030_merchant_plaque_subscriptions.sql.
export async function getEffectiveHubTier(merchantId: string): Promise<EffectiveHubTier> {
  const db = createServiceRoleClient();
  const { data } = await db
    .from("merchant_plaque_subscriptions")
    .select("status")
    .eq("merchant_id", merchantId)
    .maybeSingle();
  return data?.status === "active" ? "pro" : "presence";
}

// "YYYY-MM" in Europe/Paris — matches the format the try_record_hub_modification
// Postgres function computes via to_char(... , 'YYYY-MM').
function currentYearMonthParis(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit" }).format(
    new Date()
  );
}

export async function getHubModificationStatus(merchantId: string): Promise<HubModificationStatus> {
  const effectiveTier = await getEffectiveHubTier(merchantId);
  if (effectiveTier === "pro") {
    return { effectiveTier, usedThisMonth: 0, remaining: null };
  }

  const db = createServiceRoleClient();
  const yearMonth = currentYearMonthParis();
  const { count } = await db
    .from("merchant_hub_modifications")
    .select("id", { count: "exact", head: true })
    .eq("merchant_id", merchantId)
    .eq("year_month", yearMonth);

  const usedThisMonth = count ?? 0;
  return { effectiveTier, usedThisMonth, remaining: Math.max(0, HUB_MONTHLY_MODIFICATION_LIMIT - usedThisMonth) };
}
