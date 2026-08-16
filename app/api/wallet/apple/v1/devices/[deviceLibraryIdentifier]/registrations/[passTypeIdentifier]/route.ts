import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Devices echo back whatever `lastUpdated` string we returned on their
// previous poll as the next request's `passesUpdatedSince` — but
// URLSearchParams decodes query strings as application/x-www-form-urlencoded,
// where a literal "+" means "space". A timestamp we format with a "+00:00"
// UTC offset (Postgres/Supabase's default timestamptz text form) comes back
// mangled as " 00:00", which Postgres can't parse, `.gt()` errors out, and —
// since the error wasn't being checked — the endpoint silently answered
// "nothing changed" on every single poll after the first. The device never
// re-fetched an updated pass and no notification ever showed, no matter how
// many times the underlying card actually changed. Fixed two ways: always
// emit "Z"-suffixed UTC timestamps (unambiguous under www-form-urlencoded,
// unlike "+00:00"), and repair an incoming "+" that arrived as a space so
// devices that already cached a poisoned cursor recover on their own.
function repairMangledOffset(value: string): string {
  return value.replace(/ (\d{2}:\d{2})$/, "+$1");
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ deviceLibraryIdentifier: string; passTypeIdentifier: string }> }
) {
  const { deviceLibraryIdentifier, passTypeIdentifier } = await params;
  const rawSince = new URL(request.url).searchParams.get("passesUpdatedSince");
  const since = rawSince ? repairMangledOffset(rawSince) : null;

  const db = createServiceRoleClient();

  const { data: registrations } = await db
    .from("wallet_pass_registrations")
    .select("serial_number")
    .eq("device_library_identifier", deviceLibraryIdentifier)
    .eq("pass_type_identifier", passTypeIdentifier);

  if (!registrations || registrations.length === 0) {
    return new NextResponse(null, { status: 204 });
  }

  const serials = registrations.map((r) => r.serial_number);

  let query = db
    .from("loyalty_cards")
    .select("pass_serial_number, apple_pass_updated_at")
    .in("pass_serial_number", serials);

  if (since) query = query.gt("apple_pass_updated_at", since);

  const { data: cards, error } = await query;

  // A malformed `since` (still possible despite the repair above, e.g. a
  // completely different shape) must not look identical to "nothing
  // changed" — fall back to returning every registered card rather than
  // silently going quiet the way the unchecked-error version did.
  if (error) {
    console.error("Apple wallet registrations lookup failed, falling back to unfiltered", error);
    const { data: allCards } = await db
      .from("loyalty_cards")
      .select("pass_serial_number, apple_pass_updated_at")
      .in("pass_serial_number", serials);
    return respond(allCards);
  }

  return respond(cards);
}

function respond(cards: { pass_serial_number: string; apple_pass_updated_at: string | null }[] | null) {
  if (!cards || cards.length === 0) {
    return new NextResponse(null, { status: 204 });
  }

  const lastUpdated = cards.reduce(
    (max, c) => (c.apple_pass_updated_at && c.apple_pass_updated_at > max ? c.apple_pass_updated_at : max),
    "1970-01-01T00:00:00.000Z"
  );

  return NextResponse.json({
    lastUpdated: new Date(lastUpdated).toISOString(),
    serialNumbers: cards.map((c) => c.pass_serial_number),
  });
}
