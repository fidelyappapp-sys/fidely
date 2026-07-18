import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { STAFF_SCAN_COOKIE, verifyStaffScanSession } from "@/lib/staffScanAuth";
import type { MerchantStaffRole } from "@/lib/supabase/types";

export interface MerchantContext {
  merchantId: string;
  businessName: string;
  slug: string;
  brandColor: string;
  logoUrl: string | null;
  subscriptionStatus: string;
  role: MerchantStaffRole;
  userId: string;
}

// Resolves the authenticated user's merchant + role, or redirects to
// /login (no session) or /onboarding (no merchant yet). Every dashboard
// page should call this first — it relies on the RLS policies on
// merchant_staff/merchants (is_merchant_staff), so it only ever returns
// data the caller is actually a member of.
export async function requireMerchantContext(): Promise<MerchantContext> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: staffRow } = await supabase
    .from("merchant_staff")
    .select("role, merchant_id, merchants(business_name, slug, brand_color, logo_url, subscription_status)")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!staffRow || !staffRow.merchants) redirect("/onboarding");

  const merchant = staffRow.merchants as unknown as {
    business_name: string;
    slug: string;
    brand_color: string;
    logo_url: string | null;
    subscription_status: string;
  };

  return {
    merchantId: staffRow.merchant_id,
    businessName: merchant.business_name,
    slug: merchant.slug,
    brandColor: merchant.brand_color,
    logoUrl: merchant.logo_url,
    subscriptionStatus: merchant.subscription_status,
    role: staffRow.role as MerchantStaffRole,
    userId: user.id,
  };
}

// Same lookup as requireMerchantContext, but for API Route Handlers: never
// redirects, just returns null so the caller can respond with 401/403 JSON.
//
// Also accepts a staff scan-session cookie (see lib/staffScanAuth.ts) as a
// fallback when there's no Supabase Auth session — the /staff-scan device
// flow relies on that path, not on requireMerchantContext(), since it never
// establishes a real Supabase session.
export async function getStaffContextOrNull(): Promise<{
  merchantId: string;
  userId: string | null;
} | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: staffRow } = await supabase
      .from("merchant_staff")
      .select("merchant_id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (staffRow) return { merchantId: staffRow.merchant_id, userId: user.id };
  }

  const cookieStore = await cookies();
  const scanToken = cookieStore.get(STAFF_SCAN_COOKIE)?.value;
  if (!scanToken) return null;

  const session = await verifyStaffScanSession(scanToken);
  if (!session) return null;

  return { merchantId: session.merchantId, userId: session.authUserId };
}
