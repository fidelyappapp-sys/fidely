import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

// 90 days: merchants/employees shouldn't have to re-enter credentials every
// browser session just to open the scan page.
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 90;

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookieOptions: { maxAge: SESSION_COOKIE_MAX_AGE } }
  );
}
