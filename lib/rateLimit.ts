import { createServiceRoleClient } from "@/lib/supabase/server";

// Simple sliding-window rate limiter backed by Postgres (rate_limit_events).
// Good enough for a low-volume public endpoint like /join or /scan; not
// meant to defend against a determined DDoS.
export async function checkRateLimit(params: {
  bucketKey: string;
  limit: number;
  windowSeconds: number;
}): Promise<{ allowed: boolean }> {
  const db = createServiceRoleClient();
  const windowStart = new Date(Date.now() - params.windowSeconds * 1000).toISOString();

  const { count } = await db
    .from("rate_limit_events")
    .select("id", { count: "exact", head: true })
    .eq("bucket_key", params.bucketKey)
    .gte("created_at", windowStart);

  if ((count ?? 0) >= params.limit) {
    return { allowed: false };
  }

  await db.from("rate_limit_events").insert({ bucket_key: params.bucketKey });
  return { allowed: true };
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "unknown";
}
