import { isGoogleWalletConfigured } from "@/lib/env";
import type { PushStatus } from "@/lib/supabase/types";

// PATCHes the Google Wallet loyalty object's point balance, which triggers
// Google's own device notification — no separate push infrastructure
// needed. Real implementation lands in Phase 6 (lib/wallet/google/objects.ts);
// until Google credentials are configured this safely no-ops.
export async function notifyGoogleWalletUpdate(
  googleObjectId: string | null,
  points: number,
  message?: { header: string; body: string }
): Promise<PushStatus> {
  if (!isGoogleWalletConfigured || !googleObjectId) return "skipped";

  try {
    const { patchLoyaltyObjectPoints } = await import("./objects");
    await patchLoyaltyObjectPoints(googleObjectId, points, message);
    return "sent";
  } catch (err) {
    console.error("Google wallet push failed", err);
    return "failed";
  }
}

// Standalone message push (birthday, review request, manual broadcast) —
// doesn't touch the points balance.
export async function notifyGoogleWalletMessage(
  googleObjectId: string | null,
  header: string,
  body: string
): Promise<PushStatus> {
  if (!isGoogleWalletConfigured || !googleObjectId) return "skipped";

  try {
    const { pushLoyaltyObjectMessage } = await import("./objects");
    await pushLoyaltyObjectMessage(googleObjectId, header, body);
    return "sent";
  } catch (err) {
    console.error("Google wallet message push failed", err);
    return "failed";
  }
}
