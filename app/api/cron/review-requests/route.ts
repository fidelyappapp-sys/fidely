import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendCardMessage } from "@/lib/notifications/send";
import { sendWebPushToCard } from "@/lib/webPush";

export const runtime = "nodejs";

// Sends the delayed "leave us a Google review" prompt ~10 minutes after a
// scan. Scheduled via vercel.json cron; guarded by CRON_SECRET.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const db = createServiceRoleClient();

  const { data: due } = await db
    .from("review_requests")
    .select(
      "id, loyalty_card_id, merchant_id, loyalty_cards(pass_serial_number, google_object_id), merchants(business_name, google_maps_link)"
    )
    .eq("status", "pending")
    .lte("due_at", new Date().toISOString())
    .limit(200);

  let sent = 0;

  for (const row of due ?? []) {
    const card = row.loyalty_cards as unknown as {
      pass_serial_number: string;
      google_object_id: string | null;
    } | null;
    const merchant = row.merchants as unknown as {
      business_name: string;
      google_maps_link: string | null;
    } | null;

    if (!card || !merchant?.google_maps_link) {
      await db.from("review_requests").update({ status: "skipped" }).eq("id", row.id);
      continue;
    }

    const body = `Vous avez apprécié votre visite chez ${merchant.business_name} ? Laissez-nous un avis Google ici : ${merchant.google_maps_link}`;

    try {
      await Promise.allSettled([
        sendCardMessage({
          loyaltyCardId: row.loyalty_card_id,
          passSerialNumber: card.pass_serial_number,
          googleObjectId: card.google_object_id,
          header: "Votre avis compte",
          body,
        }),
        sendWebPushToCard(db, row.loyalty_card_id, {
          title: "Votre avis compte",
          body,
          url: merchant.google_maps_link,
        }),
      ]);
      await db
        .from("review_requests")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", row.id);
      sent++;
    } catch (err) {
      console.error("Review request send failed", row.id, err);
      await db.from("review_requests").update({ status: "failed" }).eq("id", row.id);
    }
  }

  return NextResponse.json({ scanned: due?.length ?? 0, sent });
}
