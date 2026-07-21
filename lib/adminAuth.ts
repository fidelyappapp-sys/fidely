import { SignJWT, jwtVerify } from "jose";
import { timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Single shared-password admin session (see lib/staffScanAuth.ts for the
// sibling pattern used by the staff-scan device flow). Deliberately its own
// secret (ADMIN_SESSION_SECRET), not shared with QR_SIGNING_SECRET or
// staff-scan sessions — this cookie grants cross-tenant access to every
// merchant's data, a much higher trust boundary than either of those.
export const ADMIN_SESSION_COOKIE = "fidely_admin_session";
const SESSION_TTL_SECONDS = 12 * 60 * 60;

function secretKey() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export function verifyAdminPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  // Pad to equal length before comparing so the length itself isn't a
  // timing oracle; timingSafeEqual throws on mismatched buffer lengths.
  if (a.length !== b.length) {
    timingSafeEqual(Buffer.concat([a, Buffer.alloc(Math.max(0, b.length - a.length))]), b);
    return false;
  }
  return timingSafeEqual(a, b);
}

export async function createAdminSession() {
  const token = await new SignJWT({ admin: true })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience("fidely-admin")
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete({ name: ADMIN_SESSION_COOKIE, path: "/admin" });
}

async function hasValidAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, secretKey(), { audience: "fidely-admin" });
    return true;
  } catch {
    return false;
  }
}

// Every admin page under app/admin/(protected) calls this first.
export async function requireAdminContext(): Promise<void> {
  if (!(await hasValidAdminSession())) redirect("/admin/login");
}
