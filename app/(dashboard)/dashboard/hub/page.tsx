import Link from "next/link";
import { requireMerchantContext } from "@/lib/merchant";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getMerchantHubConfig, getMerchantMenuItems, getMerchantPageExtras, getMerchantSocialLinks } from "@/lib/merchantPageContent";
import { getHubModificationStatus } from "@/lib/hub/modifications";
import { HubEditor } from "@/components/dashboard/HubEditor";

export default async function HubPage() {
  const merchant = await requireMerchantContext();
  const supabase = await createServerSupabaseClient();

  const { count: hubPlaqueCount } = await supabase
    .from("plaques")
    .select("id", { count: "exact", head: true })
    .eq("merchant_id", merchant.merchantId)
    .in("tier", ["presence", "pro"]);

  if (!hubPlaqueCount) {
    return (
      <div className="max-w-lg">
        <h1 className="text-2xl font-semibold">Ma page Hub</h1>
        <p className="mt-3 text-sm text-gray-600">
          La page Hub est disponible pour les plaques Présence ou Pro. Commandez-en une depuis la boutique pour
          configurer votre page.
        </p>
        <Link
          href="/boutique"
          className="mt-6 inline-block rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700"
        >
          Voir la boutique
        </Link>
      </div>
    );
  }

  const [extras, menuItems, socialLinks, hubConfig, modificationStatus] = await Promise.all([
    getMerchantPageExtras(supabase, merchant.merchantId),
    getMerchantMenuItems(supabase, merchant.merchantId),
    getMerchantSocialLinks(supabase, merchant.merchantId),
    getMerchantHubConfig(supabase, merchant.merchantId),
    getHubModificationStatus(merchant.merchantId),
  ]);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold">Ma page Hub</h1>
      <p className="mt-2 text-sm text-gray-600">
        Ce que vous configurez ici s&apos;affiche instantanément sur toutes vos plaques Présence/Pro, sans
        réimpression.
      </p>

      <HubEditor
        initial={{
          enabledTabs: hubConfig.enabledTabs,
          googleReviewLink: extras.googleReviewLink ?? "",
          phone: extras.phone ?? "",
          openingHours: extras.openingHours,
          menuItems: menuItems.map((m) => ({
            id: m.id,
            name: m.name,
            description: m.description ?? "",
            priceCents: m.price_cents,
          })),
          socialLinks: socialLinks.map((s) => ({ id: s.id, platform: s.platform, url: s.url })),
        }}
        modificationStatus={modificationStatus}
      />
    </div>
  );
}
