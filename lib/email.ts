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

interface OrderEmailItem {
  label: string;
  quantity: number;
}

export async function sendOrderConfirmationEmail(params: {
  to: string;
  businessName: string;
  items: OrderEmailItem[];
  amountCents: number;
  deliveryMethod: string;
}): Promise<void> {
  const itemsHtml = params.items.map((i) => `<li>${i.quantity} × ${i.label}</li>`).join("");
  const delivery = params.deliveryMethod === "hand_delivery" ? "Remise en main propre" : "Envoi La Poste";
  await sendEmail(
    params.to,
    "Confirmation de votre commande Fidély",
    `<p>Bonjour,</p><p>Votre commande pour <strong>${params.businessName}</strong> est confirmée :</p><ul>${itemsHtml}</ul><p>Total : ${(params.amountCents / 100).toFixed(2)}€</p><p>Livraison : ${delivery}</p>`
  );
}

export async function sendAdminOrderNotification(params: {
  businessName: string;
  items: OrderEmailItem[];
  amountCents: number;
  deliveryMethod: string;
  shippingAddress: { name: string; line1: string; line2: string; postalCode: string; city: string; country: string } | null;
}): Promise<void> {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!adminEmail) {
    console.warn("[email] ADMIN_NOTIFICATION_EMAIL non configuré, notification de commande non envoyée");
    return;
  }
  const itemsHtml = params.items.map((i) => `<li>${i.quantity} × ${i.label}</li>`).join("");
  const delivery = params.deliveryMethod === "hand_delivery" ? "Remise en main propre" : "Envoi La Poste";
  const addressHtml = params.shippingAddress
    ? `<p>${params.shippingAddress.name}<br/>${params.shippingAddress.line1} ${params.shippingAddress.line2}<br/>${params.shippingAddress.postalCode} ${params.shippingAddress.city}, ${params.shippingAddress.country}</p>`
    : "";
  await sendEmail(
    adminEmail,
    `Nouvelle commande boutique — ${params.businessName}`,
    `<p>Commande de <strong>${params.businessName}</strong> :</p><ul>${itemsHtml}</ul><p>Total : ${(params.amountCents / 100).toFixed(2)}€</p><p>Livraison : ${delivery}</p>${addressHtml}`
  );
}
