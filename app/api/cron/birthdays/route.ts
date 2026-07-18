import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendCardMessage } from "@/lib/notifications/send";
import { sendWebPushToCard } from "@/lib/webPush";

export const runtime = "nodejs";

// Daily birthday notifications: finds every card whose customer's birthday
// is today and whose merchant opted in (find_birthday_cards also excludes
// cards already notified this calendar year). Scheduled via vercel.json
// cron; guarded by CRON_SECRET.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const db = createServiceRoleClient();
  const currentYear = new Date().getUTCFullYear();

  const { data: cards } = await db.rpc("find_birthday_cards");

  const perMerchant = new Map<string, { businessName: string; count: number }>();

  for (const card of cards ?? []) {
    const body = `Joyeux anniversaire ! Venez chercher votre cadeau chez ${card.business_name} 🎂`;

    try {
      await Promise.allSettled([
        sendCardMessage({
          loyaltyCardId: card.loyalty_card_id,
          passSerialNumber: card.pass_serial_number,
          googleObjectId: card.google_object_id,
          header: "Joyeux anniversaire !",
          body,
        }),
        sendWebPushToCard(db, card.loyalty_card_id, { title: "Joyeux anniversaire !", body }),
      ]);
      await db
        .from("loyalty_cards")
        .update({ last_birthday_year: currentYear })
        .eq("id", card.loyalty_card_id);

      const entry = perMerchant.get(card.merchant_id) ?? {
        businessName: card.business_name,
        count: 0,
      };
      entry.count++;
      perMerchant.set(card.merchant_id, entry);
    } catch (err) {
      console.error("Birthday notification failed", card.loyalty_card_id, err);
    }
  }

  for (const [merchantId, entry] of perMerchant) {
    await db.from("push_notifications").insert({
      merchant_id: merchantId,
      type: "birthday",
      title: "Notifications d'anniversaire",
      body: `Message d'anniversaire envoyé à ${entry.count} client${entry.count > 1 ? "s" : ""}.`,
      recipient_count: entry.count,
    });
  }

  return NextResponse.json({ notified: cards?.length ?? 0 });
}
