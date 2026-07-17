import { NextResponse } from "next/server";
import { STAFF_SCAN_COOKIE } from "@/lib/staffScanAuth";
import { appBaseUrl } from "@/lib/env";

export const runtime = "nodejs";

// Clears the device's staff scan session — used by the "changer d'employé"
// button so the next person can scan their own QR.
export async function GET() {
  const response = NextResponse.redirect(new URL("/staff-scan", appBaseUrl()));
  response.cookies.delete(STAFF_SCAN_COOKIE);
  return response;
}
