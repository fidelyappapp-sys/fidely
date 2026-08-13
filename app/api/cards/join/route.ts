import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { joinSchema } from "@/lib/validation/schemas";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { allowed } = await checkRateLimit({
    bucketKey: `join:${clientIp(request)}`,
    limit: 10,
    windowSeconds: 600,
  });
  if (!allowed) {
    return NextResponse.json({ error: "Trop de tentatives, réessayez plus tard." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = joinSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." },
      { status: 400 }
    );
  }

  const { merchantSlug, fullName, email, phone, birthDate, source } = parsed.data;
  const db = createServiceRoleClient();

  const { data: merchant } = await db
    .from("merchants")
    .select("id, onboarding_completed, subscription_status")
    .eq("slug", merchantSlug)
    .maybeSingle();

  if (!merchant || !merchant.onboarding_completed) {
    return NextResponse.json({ error: "Commerce introuvable." }, { status: 404 });
  }

  // A merchant without a validated card on file ("incomplete", never
  // subscribed, or "canceled"/"past_due") can't onboard new customers —
  // the join QR code must be non-functional until billing is active.
  if (merchant.subscription_status !== "active") {
    return NextResponse.json(
      { error: "Ce commerce n'a pas encore activé son abonnement." },
      { status: 403 }
    );
  }

  // `source` is the id of the merchant_qr_codes row the customer scanned
  // (a join_source point of sale) — falls back to the merchant's "main"
  // point of sale (the original /join/<slug> QR, no source param) when
  // absent or when the id doesn't resolve to one of this merchant's rows.
  let pointOfSale: { id: string; label: string; loyalty_program_id: string | null } | null = null;

  if (source) {
    const { data } = await db
      .from("merchant_qr_codes")
      .select("id, label, loyalty_program_id")
      .eq("id", source)
      .eq("merchant_id", merchant.id)
      .maybeSingle();
    pointOfSale = data;
  }

  if (!pointOfSale) {
    const { data } = await db
      .from("merchant_qr_codes")
      .select("id, label, loyalty_program_id")
      .eq("merchant_id", merchant.id)
      .eq("kind", "main")
      .maybeSingle();
    pointOfSale = data;
  }

  if (!pointOfSale || !pointOfSale.loyalty_program_id) {
    return NextResponse.json(
      { error: "Ce commerce n'a pas encore configuré de programme de fidélité." },
      { status: 404 }
    );
  }

  const programId = pointOfSale.loyalty_program_id;

  let customerId: string | null = null;

  // Only columns guaranteed to exist since 0001_init.sql — customer
  // lookup/creation must keep working regardless of whether the
  // notifications migration (birth_date) has landed on this database yet.
  if (email) {
    const { data: existingCustomer } = await db
      .from("customers")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (existingCustomer) customerId = existingCustomer.id;
  }

  // Email is optional, so customers who sign up without one (or with a
  // different email each time) must still be matched by phone — otherwise
  // every join creates a fresh "unnamed" duplicate instead of reusing the
  // existing record.
  if (!customerId && phone) {
    const { data: existingByPhone } = await db
      .from("customers")
      .select("id")
      .eq("phone", phone)
      .maybeSingle();
    if (existingByPhone) customerId = existingByPhone.id;
  }

  if (!customerId) {
    const { data: newCustomer, error: customerError } = await db
      .from("customers")
      .insert({
        full_name: fullName || null,
        email: email || null,
        phone: phone || null,
      })
      .select("id")
      .single();

    if (customerError || !newCustomer) {
      return NextResponse.json(
        { error: customerError?.message ?? "Impossible de créer le profil client." },
        { status: 500 }
      );
    }
    customerId = newCustomer.id;
  }

  // Best-effort, applied separately so a missing birth_date column can't
  // break signup for anyone.
  if (birthDate && customerId) {
    await db.from("customers").update({ birth_date: birthDate }).eq("id", customerId);
  }

  const { data: existingCard } = await db
    .from("loyalty_cards")
    .select("public_id")
    .eq("merchant_id", merchant.id)
    .eq("loyalty_program_id", programId)
    .eq("customer_id", customerId)
    .maybeSingle();

  if (existingCard) {
    return NextResponse.json({ publicId: existingCard.public_id });
  }

  const { data: card, error: cardError } = await db
    .from("loyalty_cards")
    .insert({
      merchant_id: merchant.id,
      loyalty_program_id: programId,
      customer_id: customerId,
      merchant_qr_code_id: pointOfSale.id,
      source: pointOfSale.label,
    })
    .select("public_id")
    .single();

  if (cardError || !card) {
    return NextResponse.json(
      { error: cardError?.message ?? "Impossible de créer la carte de fidélité." },
      { status: 500 }
    );
  }

  return NextResponse.json({ publicId: card.public_id }, { status: 201 });
}
