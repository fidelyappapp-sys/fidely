import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";

// Reminds merchants 7 days before their pause auto-resumes (see
// resume-expired-pauses). Window is [now+6d, now+7d) so a daily cron run
// catches each merchant exactly once; pause_reminder_sent_at is the
// per-pause dedupe guard (cleared whenever a pause starts or ends).
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const db = createServiceRoleClient();
  const windowStart = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString();
  const windowEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: merchants } = await db
    .from("merchants")
    .select("id, business_name, subscription_pause_ends_at")
    .eq("subscription_status", "paused")
    .is("pause_reminder_sent_at", null)
    .gte("subscription_pause_ends_at", windowStart)
    .lt("subscription_pause_ends_at", windowEnd);

  let sent = 0;
  for (const merchant of merchants ?? []) {
    const { data: owner } = await db
      .from("merchant_staff")
      .select("auth_user_id")
      .eq("merchant_id", merchant.id)
      .eq("role", "owner")
      .not("auth_user_id", "is", null)
      .maybeSingle();

    if (owner?.auth_user_id) {
      const { data } = await db.auth.admin.getUserById(owner.auth_user_id);
      const email = data.user?.email;
      if (email) {
        const endDate = new Date(merchant.subscription_pause_ends_at as string).toLocaleDateString("fr-FR");
        await sendEmail(
          email,
          "Votre abonnement Fidély reprend dans 7 jours",
          `<p>Bonjour,</p><p>La pause de votre abonnement pour <strong>${merchant.business_name}</strong> se termine le ${endDate}. Le prélèvement reprendra automatiquement à cette date.</p><p>Vous pouvez reprendre dès maintenant depuis votre tableau de bord, ou ne rien faire — la reprise est automatique.</p>`
        );
      }
    }

    await db.from("merchants").update({ pause_reminder_sent_at: new Date().toISOString() }).eq("id", merchant.id);
    sent++;
  }

  return NextResponse.json({ sent });
}
