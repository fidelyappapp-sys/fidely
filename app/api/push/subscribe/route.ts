import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { pushSubscribeSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = pushSubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const db = createServiceRoleClient();

  const { data: card } = await db
    .from("loyalty_cards")
    .select("id")
    .eq("public_id", parsed.data.publicId)
    .maybeSingle();

  if (!card) {
    return NextResponse.json({ error: "Carte introuvable." }, { status: 404 });
  }

  const { error } = await db.from("push_subscriptions").upsert(
    {
      loyalty_card_id: card.id,
      endpoint: parsed.data.subscription.endpoint,
      p256dh: parsed.data.subscription.keys.p256dh,
      auth: parsed.data.subscription.keys.auth,
    },
    { onConflict: "endpoint" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
