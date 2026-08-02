import { createServiceRoleClient } from "@/lib/supabase/server";
import { notifyAppleWalletUpdate } from "@/lib/wallet/apple/notify";
import { notifyGoogleWalletMessage } from "@/lib/wallet/google/notify";
import type { PushStatus } from "@/lib/supabase/types";

// Shared primitive for every non-scan notification (birthday, review
// request, manual broadcast): stamps the sentence onto the card so Apple's
// pass regeneration picks it up, then triggers both wallet pushes in
// parallel.
export async function sendCardMessage(params: {
  loyaltyCardId: string;
  passSerialNumber: string;
  googleObjectId: string | null;
  header: string;
  body: string;
}): Promise<{ apple: PushStatus; google: PushStatus }> {
  const db = createServiceRoleClient();

  await db
    .from("loyalty_cards")
    .update({ last_push_message: params.body, apple_pass_updated_at: new Date().toISOString() })
    .eq("id", params.loyaltyCardId);

  const [apple, google] = await Promise.allSettled([
    notifyAppleWalletUpdate(params.passSerialNumber),
    notifyGoogleWalletMessage(params.googleObjectId, params.header, params.body),
  ]);

  return {
    apple: apple.status === "fulfilled" ? apple.value : "failed",
    google: google.status === "fulfilled" ? google.value : "failed",
  };
}
