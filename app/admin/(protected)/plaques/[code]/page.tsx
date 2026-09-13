import { notFound } from "next/navigation";
import Link from "next/link";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { PlaqueAssignForm } from "@/components/admin/PlaqueAssignForm";

export default async function AdminPlaqueDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const db = createServiceRoleClient();

  const { data: plaque } = await db
    .from("plaques")
    .select("short_code, tier, merchant_id, merchant_name, merchant_address, google_place_id, redirect_url, loyalty_enabled, menu_config")
    .eq("short_code", code)
    .maybeSingle();

  if (!plaque) notFound();

  if (plaque.merchant_id) {
    return (
      <div>
        <Link href="/admin/plaques" className="text-sm text-indigo-600 hover:text-indigo-500">
          ← Retour
        </Link>
        <p className="mt-4 text-sm text-gray-600">
          Ce code est déjà rattaché à un compte commerçant — gérez-le depuis{" "}
          <Link href="/admin/merchants" className="text-indigo-600 hover:text-indigo-500">
            Commerçants
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div>
      <Link href="/admin/plaques" className="text-sm text-indigo-600 hover:text-indigo-500">
        ← Retour
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">
        Carte <span className="font-mono">{plaque.short_code}</span>
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        /j/{plaque.short_code} · /p/{plaque.short_code}
      </p>

      <div className="mt-6">
        <PlaqueAssignForm
          code={plaque.short_code}
          initial={{
            tier: plaque.tier,
            merchantName: plaque.merchant_name,
            merchantAddress: plaque.merchant_address,
            googlePlaceId: plaque.google_place_id,
            redirectUrl: plaque.redirect_url,
            enabledTabs: plaque.menu_config?.enabledTabs ?? null,
            loyaltyEnabled: plaque.loyalty_enabled,
          }}
        />
      </div>
    </div>
  );
}
