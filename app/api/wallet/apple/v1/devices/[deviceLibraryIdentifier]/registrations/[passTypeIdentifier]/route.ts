import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Apple PassKit Web Service: returns the serial numbers registered to this
// device whose pass has changed since `passesUpdatedSince`.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ deviceLibraryIdentifier: string; passTypeIdentifier: string }> }
) {
  const { deviceLibraryIdentifier, passTypeIdentifier } = await params;
  const since = new URL(request.url).searchParams.get("passesUpdatedSince");

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

  const { data: cards } = await db
    .from("loyalty_cards")
    .select("pass_serial_number, apple_pass_updated_at")
    .in("pass_serial_number", serials)
    .gt("apple_pass_updated_at", since ?? "1970-01-01T00:00:00Z");

  if (!cards || cards.length === 0) {
    return new NextResponse(null, { status: 204 });
  }

  const lastUpdated = cards.reduce(
    (max, c) => (c.apple_pass_updated_at > max ? c.apple_pass_updated_at : max),
    "1970-01-01T00:00:00Z"
  );

  return NextResponse.json({
    lastUpdated,
    serialNumbers: cards.map((c) => c.pass_serial_number),
  });
}
