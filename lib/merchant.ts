import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { STAFF_SCAN_COOKIE, verifyStaffScanSession } from "@/lib/staffScanAuth";
import type { MerchantStaffRole } from "@/lib/supabase/types";

export interface MerchantContext {
  merchantId: string;
  businessName: string;
  slug: string;
  brandColor: string;
  logoUrl: string | null;
  subscriptionStatus: string;
  onboardingCompleted: boolean;
  role: MerchantStaffRole;
  userId: string;
  // Every commerce this user belongs to — length 1 for the common case.
  // The dashboard merchant switcher only renders when there's more than one.
  allMerchants: { merchantId: string; businessName: string }[];
}

// Cookie holding the merchant_id the user is currently viewing, for users
// who belong to more than one commerce (see lib/actions/boutique.ts ->
// createAdditionalMerchant). Absent or stale values just fall back to the
// first commerce below — this is a view preference, not an auth boundary
// (every row returned here is already scoped to the caller via RLS).
export const ACTIVE_MERCHANT_COOKIE = "fidely_active_merchant";

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

  const { data: staffRows } = await supabase
    .from("merchant_staff")
    .select(
      "role, merchant_id, merchants(business_name, slug, brand_color, logo_url, subscription_status, onboarding_completed)"
    )
    .eq("auth_user_id", user.id);

  if (!staffRows || staffRows.length === 0) redirect("/onboarding");

  const cookieStore = await cookies();
  const activeMerchantId = cookieStore.get(ACTIVE_MERCHANT_COOKIE)?.value;
  const staffRow = staffRows.find((row) => row.merchant_id === activeMerchantId) ?? staffRows[0];

  if (!staffRow.merchants) redirect("/onboarding");

  const merchant = staffRow.merchants as unknown as {
    business_name: string;
    slug: string;
    brand_color: string;
    logo_url: string | null;
    subscription_status: string;
    onboarding_completed: boolean;
  };

  return {
    merchantId: staffRow.merchant_id,
    businessName: merchant.business_name,
    slug: merchant.slug,
    brandColor: merchant.brand_color,
    logoUrl: merchant.logo_url,
    subscriptionStatus: merchant.subscription_status,
    onboardingCompleted: merchant.onboarding_completed,
    role: staffRow.role as MerchantStaffRole,
    userId: user.id,
    allMerchants: staffRows
      .filter((row) => row.merchants)
      .map((row) => ({
        merchantId: row.merchant_id,
        businessName: (row.merchants as unknown as { business_name: string }).business_name,
      })),
  };
}

export interface OnboardingMerchant {
  merchantId: string;
  businessName: string;
  onboardingCompleted: boolean;
}

// Lookup used by the onboarding wizard steps (app/(onboarding)/onboarding/*)
// — unlike requireMerchantContext(), a merchant with onboarding_completed:
// false is an expected, normal state here (that's the whole point of the
// wizard), so this never redirects on that basis. Returns null before step 1
// has created the merchant row at all.
export async function getOnboardingMerchant(): Promise<OnboardingMerchant | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: staffRows } = await supabase
    .from("merchant_staff")
    .select("merchant_id, merchants(business_name, onboarding_completed)")
    .eq("auth_user_id", user.id)
    .limit(1);

  const staffRow = staffRows?.[0];
  if (!staffRow?.merchants) return null;

  const merchant = staffRow.merchants as unknown as {
    business_name: string;
    onboarding_completed: boolean;
  };

  return {
    merchantId: staffRow.merchant_id,
    businessName: merchant.business_name,
    onboardingCompleted: merchant.onboarding_completed,
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

  const cookieStore = await cookies();

  if (user) {
    const { data: staffRows } = await supabase
      .from("merchant_staff")
      .select("merchant_id")
      .eq("auth_user_id", user.id);

    if (staffRows && staffRows.length > 0) {
      const activeMerchantId = cookieStore.get(ACTIVE_MERCHANT_COOKIE)?.value;
      const staffRow = staffRows.find((row) => row.merchant_id === activeMerchantId) ?? staffRows[0];
      return { merchantId: staffRow.merchant_id, userId: user.id };
    }
  }

  const scanToken = cookieStore.get(STAFF_SCAN_COOKIE)?.value;
  if (!scanToken) return null;

  const session = await verifyStaffScanSession(scanToken);
  if (!session) return null;

  // The JWT alone only proves the cookie was legitimately issued — with a
  // 60-day TTL that's not enough on its own. Re-check membership is still
  // active on every request so removing a staff member revokes their scan
  // access immediately instead of waiting out the token's expiry.
  const db = createServiceRoleClient();
  const { data: staffRow } = await db
    .from("merchant_staff")
    .select("id")
    .eq("id", session.staffId)
    .eq("merchant_id", session.merchantId)
    .eq("active", true)
    .maybeSingle();

  if (!staffRow) return null;

  return { merchantId: session.merchantId, userId: session.authUserId };
}
