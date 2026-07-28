import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { STAFF_SCAN_COOKIE, SESSION_TTL_SECONDS, signStaffScanSession } from "@/lib/staffScanAuth";
import { appBaseUrl } from "@/lib/env";

export const runtime = "nodejs";

// Opened by scanning an employee's personal QR code (see the "Équipe"
// dashboard page): sets this device up as that employee for the /staff-scan
// scanner, without requiring a Supabase Auth login on a shared counter
// tablet.
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = createServiceRoleClient();

  const { data: staffRow, error } = await db
    .from("merchant_staff")
    .select("id, merchant_id, auth_user_id, active")
    .eq("scan_token", token)
    .eq("active", true)
    .maybeSingle();

  const url = new URL("/staff-scan", appBaseUrl());
  if (error || !staffRow) {
    url.searchParams.set("invalid", "1");
    return NextResponse.redirect(url);
  }

  const session = await signStaffScanSession({
    merchantId: staffRow.merchant_id,
    staffId: staffRow.id,
    authUserId: staffRow.auth_user_id,
  });

  const response = NextResponse.redirect(url);
  response.cookies.set(STAFF_SCAN_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return response;
}
