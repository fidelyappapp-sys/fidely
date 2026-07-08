import { isGoogleWalletConfigured } from "@/lib/env";
import type { PushStatus } from "@/lib/supabase/types";

// PATCHes the Google Wallet loyalty object's point balance, which triggers
// Google's own device notification — no separate push infrastructure
// needed. Real implementation lands in Phase 6 (lib/wallet/google/objects.ts);
// until Google credentials are configured this safely no-ops.
export async function notifyGoogleWalletUpdate(
  googleObjectId: string | null,
  points: number
): Promise<PushStatus> {
  if (!isGoogleWalletConfigured || !googleObjectId) return "skipped";

  try {
    const { patchLoyaltyObjectPoints } = await import("./objects");
    await patchLoyaltyObjectPoints(googleObjectId, points);
    return "sent";
  } catch (err) {
    console.error("Google wallet push failed", err);
    return "failed";
  }
}
