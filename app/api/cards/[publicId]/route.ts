import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ publicId: string }> }
) {
  const { publicId } = await params;
  const db = createServiceRoleClient();

  const { data: card } = await db
    .from("loyalty_cards")
    .select(
      "points, merchant_id, loyalty_program_id, merchants(business_name, brand_color), loyalty_programs(reward_threshold, reward_description)"
    )
    .eq("public_id", publicId)
    .maybeSingle();

  if (!card) {
    return NextResponse.json({ error: "Carte introuvable." }, { status: 404 });
  }

  const merchant = card.merchants as unknown as {
    business_name: string;
    brand_color: string;
  } | null;
  const program = card.loyalty_programs as unknown as {
    reward_threshold: number;
    reward_description: string;
  } | null;

  return NextResponse.json({
    points: card.points,
    businessName: merchant?.business_name ?? "",
    brandColor: merchant?.brand_color ?? "#111827",
    rewardThreshold: program?.reward_threshold ?? 0,
    rewardDescription: program?.reward_description ?? "",
  });
}
