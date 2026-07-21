"use server";

import { revalidatePath } from "next/cache";
import { requireAdminContext } from "@/lib/adminAuth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

export interface BroadcastActionState {
  error?: string;
  sentCount?: number;
}

export async function sendBroadcastMessage(
  _prevState: BroadcastActionState,
  formData: FormData
): Promise<BroadcastActionState> {
  await requireAdminContext();

  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!subject || !body) return { error: "Sujet et message requis." };

  const db = createServiceRoleClient();
  const { data: owners } = await db
    .from("merchant_staff")
    .select("auth_user_id")
    .eq("role", "owner")
    .not("auth_user_id", "is", null);

  const authUserIds = [...new Set((owners ?? []).map((o) => o.auth_user_id).filter(Boolean))] as string[];

  const html = body
    .split("\n")
    .map((line) => `<p>${line}</p>`)
    .join("");

  const results = await Promise.allSettled(
    authUserIds.map(async (id) => {
      const { data } = await db.auth.admin.getUserById(id);
      const email = data.user?.email;
      if (!email) return;
      await sendEmail(email, subject, html);
    })
  );

  revalidatePath("/admin");
  return { sentCount: results.filter((r) => r.status === "fulfilled").length };
}
