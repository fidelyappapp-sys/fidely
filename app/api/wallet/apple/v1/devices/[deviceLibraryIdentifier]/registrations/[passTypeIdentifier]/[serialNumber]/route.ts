import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyPassKitAuth } from "@/lib/wallet/apple/webservice";

export const runtime = "nodejs";

interface RouteParams {
  deviceLibraryIdentifier: string;
  passTypeIdentifier: string;
  serialNumber: string;
}

// Apple PassKit Web Service: register a device for push updates on a pass.
export async function POST(request: Request, { params }: { params: Promise<RouteParams> }) {
  const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } = await params;

  const authorized = await verifyPassKitAuth(
    passTypeIdentifier,
    serialNumber,
    request.headers.get("authorization")
  );
  if (!authorized) {
    return NextResponse.json({}, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const pushToken = body?.pushToken;
  if (typeof pushToken !== "string" || !pushToken) {
    return NextResponse.json({}, { status: 400 });
  }

  const db = createServiceRoleClient();

  const { data: existing } = await db
    .from("wallet_pass_registrations")
    .select("id")
    .eq("device_library_identifier", deviceLibraryIdentifier)
    .eq("serial_number", serialNumber)
    .maybeSingle();

  if (existing) {
    await db.from("wallet_pass_registrations").update({ push_token: pushToken }).eq("id", existing.id);
    return NextResponse.json({}, { status: 200 });
  }

  await db.from("wallet_pass_registrations").insert({
    device_library_identifier: deviceLibraryIdentifier,
    pass_type_identifier: passTypeIdentifier,
    serial_number: serialNumber,
    push_token: pushToken,
  });

  return NextResponse.json({}, { status: 201 });
}

// Apple PassKit Web Service: unregister a device from push updates.
export async function DELETE(request: Request, { params }: { params: Promise<RouteParams> }) {
  const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } = await params;

  const authorized = await verifyPassKitAuth(
    passTypeIdentifier,
    serialNumber,
    request.headers.get("authorization")
  );
  if (!authorized) {
    return NextResponse.json({}, { status: 401 });
  }

  const db = createServiceRoleClient();
  await db
    .from("wallet_pass_registrations")
    .delete()
    .eq("device_library_identifier", deviceLibraryIdentifier)
    .eq("serial_number", serialNumber);

  return NextResponse.json({}, { status: 200 });
}
