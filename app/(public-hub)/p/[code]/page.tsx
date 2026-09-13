import { notFound, redirect } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
  getMerchantHubConfig,
  getMerchantMenuItems,
  getMerchantPageExtras,
  getMerchantSocialLinks,
} from "@/lib/merchantPageContent";
import { getEffectiveHubTier } from "@/lib/hub/modifications";
import { isTranslationConfigured } from "@/lib/env";
import { HubTabs } from "@/components/hub/HubTabs";
import { StandaloneHubTabs } from "@/components/hub/StandaloneHubTabs";
import { buildGoogleReviewUrl } from "@/lib/googleReview";

// Every "plaque" (Avis/Présence/Pro, see supabase/migrations/0027_plaques.sql)
// prints this short code onto its QR/NFC — including the /j/{code} batch
// rewritten to this route (see next.config.ts, 0034_j_code_import.sql).
// Resolving it here — fresh on every scan, never cached client- or
// edge-side — is what lets a merchant's content change instantly with no
// reprint: the physical plaque only ever encodes this stable code, never
// the destination itself.
export const dynamic = "force-dynamic";

export default async function PlaquePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const db = createServiceRoleClient();

  const { data: plaque } = await db
    .from("plaques")
    .select(
      "tier, merchant_id, avis_link_id, redirect_url, loyalty_enabled, merchant_name, merchant_address, google_place_id, menu_config, merchants(google_review_link), avis_links(google_review_link)"
    )
    .eq("short_code", code)
    .maybeSingle();

  if (!plaque) notFound();

  if (!plaque.tier) {
    return (
      <div className="mx-auto max-w-sm px-6 py-24 text-center text-sm text-gray-500">
        Cette carte n&apos;est pas encore activée.
      </div>
    );
  }

  if (plaque.tier === "avis") {
    const link =
      plaque.redirect_url ??
      (plaque.merchants as unknown as { google_review_link: string | null } | null)?.google_review_link ??
      (plaque.avis_links as unknown as { google_review_link: string | null } | null)?.google_review_link ??
      (plaque.google_place_id ? buildGoogleReviewUrl(plaque.google_place_id) : null);

    if (!link) {
      return (
        <div className="mx-auto max-w-sm px-6 py-24 text-center text-sm text-gray-500">
          Lien d&apos;avis non configuré pour le moment.
        </div>
      );
    }
    redirect(link);
  }

  // presence / pro, standalone (no merchant account — see 0034)
  if (!plaque.merchant_id) {
    return (
      <div className="min-h-full bg-gray-50 pb-16">
        <div className="mx-auto max-w-md px-6 pt-10">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-900 text-xl font-bold text-white shadow">
              {plaque.merchant_name?.[0]?.toUpperCase() ?? "F"}
            </div>
            <h1 className="mt-4 font-serif text-2xl font-semibold text-gray-900">
              {plaque.merchant_name ?? "Commerçant"}
            </h1>
          </div>
          <div className="mt-8">
            <StandaloneHubTabs
              merchantName={plaque.merchant_name}
              merchantAddress={plaque.merchant_address}
              googleReviewUrl={plaque.google_place_id ? buildGoogleReviewUrl(plaque.google_place_id) : null}
              menuConfig={plaque.menu_config}
              showLoyaltyTab={plaque.tier === "pro" && plaque.loyalty_enabled}
            />
          </div>
        </div>
      </div>
    );
  }

  const merchantId = plaque.merchant_id;

  const [extras, menuItems, socialLinks, hubConfig, effectiveTier] = await Promise.all([
    getMerchantPageExtras(db, merchantId),
    getMerchantMenuItems(db, merchantId),
    getMerchantSocialLinks(db, merchantId),
    getMerchantHubConfig(db, merchantId),
    getEffectiveHubTier(merchantId),
  ]);

  const { data: merchant } = await db
    .from("merchants")
    .select("business_name, logo_url, brand_color")
    .eq("id", merchantId)
    .maybeSingle();

  return (
    <div className="min-h-full bg-gray-50 pb-16">
      <div className="mx-auto max-w-md px-6 pt-10">
        <div className="text-center">
          {merchant?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={merchant.logo_url} alt={merchant.business_name} className="mx-auto h-16 w-16 rounded-2xl object-cover shadow" />
          ) : (
            <div
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold text-white shadow"
              style={{ backgroundColor: merchant?.brand_color ?? "#111827" }}
            >
              {merchant?.business_name?.[0]?.toUpperCase() ?? "F"}
            </div>
          )}
          <h1 className="mt-4 font-serif text-2xl font-semibold text-gray-900">{merchant?.business_name}</h1>
        </div>

        <div className="mt-8">
          <HubTabs
            plaqueCode={code}
            enabledTabs={hubConfig.enabledTabs}
            effectiveTier={effectiveTier}
            translationAvailable={isTranslationConfigured}
            menuItems={menuItems}
            openingHours={extras.openingHours}
            phone={extras.phone}
            googleReviewLink={extras.googleReviewLink}
            socialLinks={socialLinks}
          />
        </div>
      </div>
    </div>
  );
}
