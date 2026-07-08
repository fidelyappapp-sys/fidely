import { isAppleWalletConfigured } from "@/lib/env";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { PushStatus } from "@/lib/supabase/types";

// Pushes a silent APNs notification to every device registered for this
// pass's serial number, telling iOS to re-fetch the pass (which now has an
// updated points field + changeMessage) from the PassKit Web Service.
// Real APNs wiring lands with the rest of the PassKit Web Service in
// Phase 5 (lib/wallet/apple/apns.ts); until Apple credentials are
// configured this safely no-ops.
export async function notifyAppleWalletUpdate(serialNumber: string): Promise<PushStatus> {
  if (!isAppleWalletConfigured) return "skipped";

  const db = createServiceRoleClient();
  const { data: registrations } = await db
    .from("wallet_pass_registrations")
    .select("push_token")
    .eq("serial_number", serialNumber);

  if (!registrations || registrations.length === 0) return "skipped";

  try {
    const { sendApplePassPush } = await import("./apns");
    await Promise.all(registrations.map((r) => sendApplePassPush(r.push_token)));
    return "sent";
  } catch (err) {
    console.error("Apple wallet push failed", err);
    return "failed";
  }
}
