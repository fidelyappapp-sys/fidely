import { createServiceRoleClient } from "@/lib/supabase/server";

// Split out from lib/boutique.ts (pure constants/functions, safe to import
// from client components like PublicNfcOrderForm) because these two need
// the service-role Supabase client — importing that from a module a client
// component also imports would pull server-only code into the client bundle.

// Cumulative lifetime quantity already owned by a merchant, across all 3
// tiers combined (one shared quantity ladder, not one per tier).
export async function getMerchantOwnedPlaqueCount(merchantId: string): Promise<number> {
  const db = createServiceRoleClient();
  const { count } = await db
    .from("plaques")
    .select("id", { count: "exact", head: true })
    .eq("merchant_id", merchantId);
  return count ?? 0;
}

// Same, keyed by buyer email for anonymous Avis-tier purchases (no account
// exists to attach a merchant_id to) — only paid/fulfilled orders count.
export async function getAnonymousOwnedPlaqueCount(buyerEmail: string): Promise<number> {
  const db = createServiceRoleClient();
  const { data } = await db
    .from("public_shop_orders")
    .select("quantity")
    .eq("buyer_email", buyerEmail)
    .in("status", ["paid", "shipped", "delivered"]);
  return (data ?? []).reduce((sum, row) => sum + row.quantity, 0);
}
