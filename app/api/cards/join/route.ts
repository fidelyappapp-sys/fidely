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

  const { merchantSlug, fullName, email, phone, birthDate } = parsed.data;
  const db = createServiceRoleClient();

  const { data: merchant } = await db
    .from("merchants")
    .select("id, onboarding_completed")
    .eq("slug", merchantSlug)
    .maybeSingle();

  if (!merchant || !merchant.onboarding_completed) {
    return NextResponse.json({ error: "Commerce introuvable." }, { status: 404 });
  }

  const { data: program } = await db
    .from("loyalty_programs")
    .select("id")
    .eq("merchant_id", merchant.id)
    .limit(1)
    .maybeSingle();

  if (!program) {
    return NextResponse.json(
      { error: "Ce commerce n'a pas encore configuré de programme de fidélité." },
      { status: 404 }
    );
  }

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
    .eq("loyalty_program_id", program.id)
    .eq("customer_id", customerId)
    .maybeSingle();

  if (existingCard) {
    return NextResponse.json({ publicId: existingCard.public_id });
  }

  const { data: card, error: cardError } = await db
    .from("loyalty_cards")
    .insert({
      merchant_id: merchant.id,
      loyalty_program_id: program.id,
      customer_id: customerId,
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
