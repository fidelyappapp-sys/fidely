import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyPassKitAuth } from "@/lib/wallet/apple/webservice";
import { buildLoyaltyPkPass } from "@/lib/wallet/apple/pkpass";

export const runtime = "nodejs";

// Apple PassKit Web Service: returns the latest signed pass for a serial
// number. Called by iOS after it receives our silent push.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ passTypeIdentifier: string; serialNumber: string }> }
) {
  const { passTypeIdentifier, serialNumber } = await params;

  const authorized = await verifyPassKitAuth(
    passTypeIdentifier,
    serialNumber,
    request.headers.get("authorization")
  );
  if (!authorized) {
    return NextResponse.json({}, { status: 401 });
  }

  const db = createServiceRoleClient();
  const { data: card } = await db
    .from("loyalty_cards")
    .select("apple_pass_updated_at")
    .eq("pass_serial_number", serialNumber)
    .maybeSingle();

  if (!card) {
    return NextResponse.json({}, { status: 404 });
  }

  const lastModified = new Date(card.apple_pass_updated_at);
  const ifModifiedSince = request.headers.get("if-modified-since");
  if (ifModifiedSince && new Date(ifModifiedSince) >= lastModified) {
    return new NextResponse(null, { status: 304 });
  }

  const buffer = await buildLoyaltyPkPass(serialNumber);
  if (!buffer) {
    return NextResponse.json({}, { status: 404 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.apple.pkpass",
      "Last-Modified": lastModified.toUTCString(),
    },
  });
}
