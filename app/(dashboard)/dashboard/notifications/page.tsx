import { requireMerchantContext } from "@/lib/merchant";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NotificationsForm } from "@/components/dashboard/NotificationsForm";
import { BirthdayToggle } from "@/components/dashboard/BirthdayToggle";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function NotificationsPage() {
  const merchant = await requireMerchantContext();
  const supabase = await createServerSupabaseClient();

  const [{ count: recipientCount }, { data: history }, { data: merchantRow }] = await Promise.all([
    supabase
      .from("loyalty_cards")
      .select("id", { count: "exact", head: true })
      .eq("merchant_id", merchant.merchantId),
    supabase
      .from("push_notifications")
      .select("id, type, title, body, recipient_count, created_at")
      .eq("merchant_id", merchant.merchantId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("merchants")
      .select("birthday_notifications_enabled")
      .eq("id", merchant.merchantId)
      .single(),
  ]);

  return (
    <div className="max-w-2xl space-y-12">
      <div>
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <p className="mt-1 text-sm text-gray-600">
          Envoyez une notification push à tous vos clients, ou automatisez les messages
          d&apos;anniversaire.
        </p>
      </div>

      <section>
        <h2 className="font-semibold text-gray-900">Envoyer une notification</h2>
        <p className="mt-1 text-sm text-gray-600">
          Le titre et le message sont poussés instantanément sur la carte Wallet de chaque
          client.
        </p>
        <div className="mt-6">
          <NotificationsForm recipientCount={recipientCount ?? 0} />
        </div>
      </section>

      <section>
        <h2 className="font-semibold text-gray-900">Anniversaires</h2>
        <p className="mt-1 text-sm text-gray-600">
          Quand un client renseigne sa date de naissance en s&apos;inscrivant, il reçoit
          automatiquement une offre le jour de son anniversaire.
        </p>
        <div className="mt-4">
          <BirthdayToggle enabled={merchantRow?.birthday_notifications_enabled ?? false} />
        </div>
      </section>

      <section>
        <h2 className="font-semibold text-gray-900">Historique</h2>
        {!history || history.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">Aucune notification envoyée pour l&apos;instant.</p>
        ) : (
          <ul className="mt-4 divide-y divide-gray-100 rounded-2xl border border-gray-100">
            {history.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-4 p-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {item.title ?? (item.type === "birthday" ? "Anniversaire" : "Notification")}
                  </p>
                  <p className="mt-0.5 text-sm text-gray-600">{item.body}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {formatDate(item.created_at)} · {item.recipient_count} destinataire
                    {item.recipient_count > 1 ? "s" : ""}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                  {item.type === "birthday" ? "Anniversaire" : "Manuel"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
