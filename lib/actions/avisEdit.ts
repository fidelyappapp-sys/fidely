"use server";

import { randomBytes, createHash } from "crypto";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { sendEmail } from "@/lib/email";
import { appBaseUrl } from "@/lib/env";

export interface AvisEditActionState {
  error?: string;
  success?: boolean;
}

const schema = z.object({
  token: z.string().min(20),
  googleReviewLink: z.string().trim().url(),
});

// Rotates the edit token on every successful use — the old token stops
// working immediately (single UPDATE guarded by the old hash closes the
// race if it's submitted twice concurrently) and a fresh one is emailed for
// next time. Never re-displays the new link on screen: email is the only
// distribution channel, matching the security review in the approved plan.
export async function updateAvisLink(_prevState: AvisEditActionState, formData: FormData): Promise<AvisEditActionState> {
  const parsed = schema.safeParse({
    token: formData.get("token"),
    googleReviewLink: formData.get("googleReviewLink"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const { allowed } = await checkRateLimit({
    bucketKey: `avis_edit_submit:${parsed.data.token.slice(0, 8)}`,
    limit: 10,
    windowSeconds: 600,
  });
  if (!allowed) return { error: "Trop de tentatives, réessayez plus tard." };

  const oldTokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
  const db = createServiceRoleClient();

  const { data: link } = await db.from("avis_links").select("id, buyer_email").eq("edit_token_hash", oldTokenHash).maybeSingle();
  if (!link) return { error: "Lien invalide ou déjà utilisé." };

  const newRawToken = randomBytes(32).toString("base64url");
  const newTokenHash = createHash("sha256").update(newRawToken).digest("hex");

  const { error: updateError, count } = await db
    .from("avis_links")
    .update(
      {
        google_review_link: parsed.data.googleReviewLink,
        edit_token_hash: newTokenHash,
        edit_token_rotated_at: new Date().toISOString(),
      },
      { count: "exact" }
    )
    .eq("edit_token_hash", oldTokenHash);

  if (updateError || !count) return { error: "Lien invalide ou déjà utilisé." };

  await sendEmail(
    link.buyer_email,
    "Votre nouveau lien de modification Fidély",
    `<p>Bonjour,</p><p>Votre lien d'avis Google a été mis à jour. Voici votre nouveau lien pour le modifier à nouveau plus tard :</p><p><a href="${appBaseUrl()}/avis/edit/${newRawToken}">${appBaseUrl()}/avis/edit/${newRawToken}</a></p><p>Ce lien remplace tous les précédents.</p>`
  );

  return { success: true };
}
