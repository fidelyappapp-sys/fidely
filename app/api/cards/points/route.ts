import { NextResponse } from "next/server";
import { getStaffContextOrNull } from "@/lib/merchant";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { adjustPointsSchema } from "@/lib/validation/schemas";
import { notifyAppleWalletUpdate } from "@/lib/wallet/apple/notify";
import { notifyGoogleWalletUpdate } from "@/lib/wallet/google/notify";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

// Manual point adjustment from the scanner (+/- buttons), separate from
// the automatic per-scan award in /api/scan. Not billed/metered — this is
// a staff correction tool, not a customer visit.
export async function POST(request: Request) {
  const staff = await getStaffContextOrNull();
  if (!staff) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { allowed } = await checkRateLimit({
    bucketKey: `adjust:${staff.merchantId}`,
    limit: 120,
    windowSeconds: 60,
  });
  if (!allowed) {
    return NextResponse.json({ error: "Trop de requêtes, ralentissez un instant." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = adjustPointsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Requête invalide." },
      { status: 400 }
    );
  }

  const db = createServiceRoleClient();

  const { data: card } = await db
    .from("loyalty_cards")
    .select("id, merchant_id, points, pass_serial_number, google_object_id, customers(full_name)")
    .eq("public_id", parsed.data.publicId)
    .maybeSingle();

  if (!card) {
    return NextResponse.json({ error: "Carte de fidélité introuvable." }, { status: 404 });
  }

  if (card.merchant_id !== staff.merchantId) {
    return NextResponse.json(
      { error: "Cette carte n'appartient pas à votre commerce." },
      { status: 403 }
    );
  }

  const { data: subscriptionRow } = await db
    .from("merchants")
    .select("subscription_status")
    .eq("id", card.merchant_id)
    .maybeSingle();

  if (
    subscriptionRow?.subscription_status === "paused" ||
    subscriptionRow?.subscription_status === "past_due"
  ) {
    return NextResponse.json(
      { error: "Abonnement suspendu. Régularisez votre facturation." },
      { status: 403 }
    );
  }

  // "incomplete" (never subscribed), "canceled", etc. — only an active
  // subscription (a validated card on file) may adjust points.
  if (subscriptionRow?.subscription_status !== "active") {
    return NextResponse.json(
      { error: "Abonnement non activé. Enregistrez une carte bancaire pour activer le scan." },
      { status: 403 }
    );
  }

  const newBalance = Math.max(0, card.points + parsed.data.delta);

  const { error: updateError } = await db
    .from("loyalty_cards")
    .update({ points: newBalance })
    .eq("id", card.id);

  if (updateError) {
    return NextResponse.json({ error: "Impossible de mettre à jour les points." }, { status: 500 });
  }

  await Promise.allSettled([
    notifyAppleWalletUpdate(card.pass_serial_number),
    notifyGoogleWalletUpdate(card.google_object_id, newBalance),
  ]);

  const customer = card.customers as unknown as { full_name: string | null } | null;

  return NextResponse.json({
    customerName: customer?.full_name ?? null,
    pointsBalance: newBalance,
  });
}
