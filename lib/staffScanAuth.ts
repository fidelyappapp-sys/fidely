import { SignJWT, jwtVerify } from "jose";

// Lets a shared counter device be handed off between employees by scanning
// their personal QR (see app/staff-scan/[token]) instead of typing login
// credentials on a shop tablet. This cookie is a *device* session, not a
// replacement for Supabase Auth: it only ever grants what
// getStaffContextOrNull() already grants to a logged-in staff member
// (POST /api/scan, POST /api/cards/points — both service-role, no RLS
// dependency), never a full authenticated dashboard session.
export const STAFF_SCAN_COOKIE = "fidely_staff_scan";
// A shop tablet shouldn't need re-authenticating every shift — 60 days, with
// the live `active` check in getStaffContextOrNull() (lib/merchant.ts) as
// the real revocation mechanism: removing a staff member blocks their scans
// immediately regardless of how much of this TTL is left.
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 60;

// Reuses QR_SIGNING_SECRET (already a required env var for customer QR
// HMACs) rather than introducing a second mandatory secret — the "aud"
// claim keeps the two token kinds from being confused with one another.
function secretKey() {
  const secret = process.env.QR_SIGNING_SECRET;
  if (!secret) throw new Error("QR_SIGNING_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export interface StaffScanSession {
  merchantId: string;
  // merchant_staff.id — always present, used to look up the employee's name.
  staffId: string;
  // merchant_staff.auth_user_id — null for name-only employees (no Supabase
  // Auth account). Scan attribution then falls back to just the merchant.
  authUserId: string | null;
}

export async function signStaffScanSession(session: StaffScanSession): Promise<string> {
  return new SignJWT({
    merchantId: session.merchantId,
    staffId: session.staffId,
    authUserId: session.authUserId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience("fidely-staff-scan")
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifyStaffScanSession(token: string): Promise<StaffScanSession | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { audience: "fidely-staff-scan" });
    if (
      typeof payload.merchantId !== "string" ||
      typeof payload.staffId !== "string" ||
      (typeof payload.authUserId !== "string" && payload.authUserId !== null)
    ) {
      return null;
    }
    return { merchantId: payload.merchantId, staffId: payload.staffId, authUserId: payload.authUserId };
  } catch {
    return null;
  }
}
