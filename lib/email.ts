import { Resend } from "resend";
import { isEmailConfigured } from "@/lib/env";

let resendSingleton: Resend | null = null;

function resend(): Resend {
  if (!resendSingleton) resendSingleton = new Resend(process.env.RESEND_API_KEY);
  return resendSingleton;
}

const FROM = "Fidély <contact@fidely.app>";

// Never throws: every caller is a background/best-effort notification path
// (cron, webhook, admin action) that shouldn't fail its main job just
// because email isn't configured yet or Resend had a hiccup.
export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!isEmailConfigured) {
    console.warn(`[email] RESEND_API_KEY non configuré, email non envoyé: "${subject}" -> ${to}`);
    return;
  }
  try {
    await resend().emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    console.error("[email] Échec de l'envoi", subject, to, err);
  }
}
