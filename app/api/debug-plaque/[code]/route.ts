import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// TEMPORARY diagnostic route — dumps exactly what the deployed app's own
// service-role client sees for a plaque row, to compare against a direct
// Postgres connection. Delete once the redirect_url mystery is resolved.
export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const db = createServiceRoleClient();

  const { data, error } = await db
    .from("plaques")
    .select(
      "tier, merchant_id, avis_link_id, link_type, redirect_url, loyalty_enabled, merchant_name, merchant_address, google_place_id, menu_config, merchants(google_review_link), avis_links(google_review_link)"
    )
    .eq("short_code", code)
    .maybeSingle();

  return NextResponse.json({ data, error, env: { url: process.env.NEXT_PUBLIC_SUPABASE_URL } });
}
