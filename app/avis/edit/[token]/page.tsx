import { createHash } from "crypto";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { AvisEditForm } from "@/components/avis/AvisEditForm";

export const dynamic = "force-dynamic";

export default async function AvisEditPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const { allowed } = await checkRateLimit({ bucketKey: `avis_edit:${ip}`, limit: 20, windowSeconds: 600 });
  if (!allowed) {
    return (
      <div className="mx-auto max-w-sm px-6 py-24 text-center text-sm text-gray-500">
        Trop de tentatives. Réessayez dans quelques minutes.
      </div>
    );
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const db = createServiceRoleClient();
  const { data: link } = await db.from("avis_links").select("google_review_link").eq("edit_token_hash", tokenHash).maybeSingle();

  if (!link) notFound();

  return (
    <div className="mx-auto max-w-sm px-6 py-24">
      <h1 className="text-xl font-semibold text-gray-900">Modifier votre lien d&apos;avis Google</h1>
      <p className="mt-2 text-sm text-gray-500">
        Un nouveau lien de modification vous sera envoyé par email après validation.
      </p>
      <AvisEditForm token={token} initialLink={link.google_review_link} />
    </div>
  );
}
