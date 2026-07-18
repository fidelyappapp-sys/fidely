import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isWebPushConfigured } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

let configured = false;
function ensureConfigured() {
  if (configured) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:contact@fidely.app",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

async function deliver(
  db: SupabaseClient<Database>,
  subs: { id: string; endpoint: string; p256dh: string; auth: string }[],
  payload: PushPayload
) {
  if (subs.length === 0) return;
  ensureConfigured();

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        // Subscription expired or was revoked by the browser — stop trying it.
        if (statusCode === 404 || statusCode === 410) {
          await db.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    })
  );
}

// Sends to every device a single customer opted in on (scan confirmation,
// review request, birthday).
export async function sendWebPushToCard(
  db: SupabaseClient<Database>,
  loyaltyCardId: string,
  payload: PushPayload
): Promise<void> {
  if (!isWebPushConfigured) return;

  const { data: subs } = await db
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("loyalty_card_id", loyaltyCardId);

  await deliver(db, subs ?? [], payload);
}

// Sends to every device across all of a merchant's customers (manual
// broadcast from the dashboard).
export async function sendWebPushToMerchant(
  db: SupabaseClient<Database>,
  merchantId: string,
  payload: PushPayload
): Promise<number> {
  if (!isWebPushConfigured) return 0;

  const { data: cards } = await db.from("loyalty_cards").select("id").eq("merchant_id", merchantId);
  const cardIds = (cards ?? []).map((c) => c.id);
  if (cardIds.length === 0) return 0;

  const { data: subs } = await db
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .in("loyalty_card_id", cardIds);

  await deliver(db, subs ?? [], payload);
  return subs?.length ?? 0;
}
