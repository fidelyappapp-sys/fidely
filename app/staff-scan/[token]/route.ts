import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { STAFF_SCAN_COOKIE, signStaffScanSession } from "@/lib/staffScanAuth";
import { appBaseUrl } from "@/lib/env";

export const runtime = "nodejs";

// Opened by scanning an employee's personal QR code (see the "QR codes"
// dashboard page): sets this device up as that employee for the /staff-scan
// scanner, without requiring a Supabase Auth login on a shared counter
// tablet. scan_token only exists once migration 0005_qr_codes.sql has been
// applied — until then this always reports an invalid link.
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = createServiceRoleClient();

  const { data: staffRow, error } = await db
    .from("merchant_staff")
    .select("merchant_id, auth_user_id")
    .eq("scan_token", token)
    .maybeSingle();

  const url = new URL("/staff-scan", appBaseUrl());
  if (error || !staffRow) {
    url.searchParams.set("invalid", "1");
    return NextResponse.redirect(url);
  }

  const session = await signStaffScanSession({
    merchantId: staffRow.merchant_id,
    staffUserId: staffRow.auth_user_id,
  });

  const response = NextResponse.redirect(url);
  response.cookies.set(STAFF_SCAN_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 12 * 60 * 60,
  });
  return response;
}
