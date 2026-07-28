import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// 90 days: merchants/employees shouldn't have to re-enter credentials every
// browser session just to open the scan page. Must match lib/supabase/client.ts
// and lib/supabase/middleware.ts so the cookie's lifetime is consistent
// regardless of which client last refreshed it.
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 90;

// Authenticated, RLS-respecting client for use in Server Components,
// Route Handlers and Server Actions. Reads/writes the user's session cookie.
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { maxAge: SESSION_COOKIE_MAX_AGE },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // called from a Server Component with no response to write to;
            // middleware.ts is responsible for refreshing the session there.
          }
        },
      },
    }
  );
}

// Service-role client: bypasses RLS entirely. Only ever import this inside
// Route Handlers that need to touch service-role-only tables (wallet push
// tokens, stripe webhook log) or mutate loyalty_cards.points server-side.
// Never expose this client or its key to the browser.
export function createServiceRoleClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
