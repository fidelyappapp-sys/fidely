"use server";

import { revalidatePath } from "next/cache";
import { requireMerchantContext } from "@/lib/merchant";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { broadcastNotificationSchema } from "@/lib/validation/schemas";
import { notifyAppleWalletUpdate } from "@/lib/wallet/apple/notify";
import { notifyGoogleWalletMessage } from "@/lib/wallet/google/notify";
import { sendWebPushToMerchant } from "@/lib/webPush";

export interface NotificationActionState {
  error?: string;
  success?: boolean;
}

export async function sendBroadcastNotification(
  _prevState: NotificationActionState,
  formData: FormData
): Promise<NotificationActionState> {
  const merchant = await requireMerchantContext();

  const parsed = broadcastNotificationSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const db = createServiceRoleClient();

  const { data: cards } = await db
    .from("loyalty_cards")
    .select("id, pass_serial_number, google_object_id")
    .eq("merchant_id", merchant.merchantId);

  if (!cards || cards.length === 0) {
    return { error: "Aucun client n'a encore de carte de fidélité." };
  }

  await db
    .from("loyalty_cards")
    .update({ last_push_message: parsed.data.body, apple_pass_updated_at: new Date().toISOString() })
    .eq("merchant_id", merchant.merchantId);

  await Promise.allSettled([
    ...cards.map((card) =>
      Promise.allSettled([
        notifyAppleWalletUpdate(card.pass_serial_number),
        notifyGoogleWalletMessage(card.google_object_id, parsed.data.title, parsed.data.body),
      ])
    ),
    sendWebPushToMerchant(db, merchant.merchantId, {
      title: parsed.data.title,
      body: parsed.data.body,
    }),
  ]);

  await db.from("push_notifications").insert({
    merchant_id: merchant.merchantId,
    type: "manual",
    title: parsed.data.title,
    body: parsed.data.body,
    recipient_count: cards.length,
  });

  revalidatePath("/dashboard/notifications");
  return { success: true };
}

export async function toggleBirthdayNotifications(
  _prevState: NotificationActionState,
  formData: FormData
): Promise<NotificationActionState> {
  const merchant = await requireMerchantContext();
  const enabled = formData.get("enabled") === "on";

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("merchants")
    .update({ birthday_notifications_enabled: enabled })
    .eq("id", merchant.merchantId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/notifications");
  return { success: true };
}
