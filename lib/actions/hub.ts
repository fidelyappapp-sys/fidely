"use server";

import { revalidatePath } from "next/cache";
import { requireMerchantContext } from "@/lib/merchant";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { publishHubConfigSchema } from "@/lib/validation/schemas";
import { getEffectiveHubTier, HUB_MONTHLY_MODIFICATION_LIMIT } from "@/lib/hub/modifications";

export interface HubActionState {
  error?: string;
  success?: boolean;
}

// One "Publier" click = one modification, regardless of how many of the
// staged sections below actually changed — so this takes a single JSON
// payload and writes everything in one server action call, rather than the
// per-field auto-save pattern used elsewhere in the dashboard (see
// lib/actions/settings.ts / pageContent.ts), which wouldn't let "one click"
// be well-defined. The quota check itself runs against the service-role
// client via a SECURITY DEFINER function (try_record_hub_modification) so it
// can't be bypassed by calling this action directly — the gate lives in the
// server action, not in a disabled button.
export async function publishHubConfig(_prevState: HubActionState, formData: FormData): Promise<HubActionState> {
  const merchant = await requireMerchantContext();

  let payload: unknown;
  try {
    payload = JSON.parse(String(formData.get("payload") ?? "{}"));
  } catch {
    return { error: "Formulaire invalide." };
  }

  const parsed = publishHubConfigSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const effectiveTier = await getEffectiveHubTier(merchant.merchantId);
  const serviceDb = createServiceRoleClient();

  if (effectiveTier !== "pro") {
    const { data: allowed, error: rpcError } = await serviceDb.rpc("try_record_hub_modification", {
      target_merchant_id: merchant.merchantId,
      monthly_limit: HUB_MONTHLY_MODIFICATION_LIMIT,
    });
    if (rpcError) return { error: rpcError.message };
    if (!allowed) {
      return {
        error: `Limite de ${HUB_MONTHLY_MODIFICATION_LIMIT} modifications atteinte pour ce mois-ci. Réessayez le mois prochain, ou passez au palier Pro pour des modifications illimitées.`,
      };
    }
  }

  const { enabledTabs, googleReviewLink, phone, openingHours, menuItems, socialLinks } = parsed.data;
  const supabase = await createServerSupabaseClient();

  const [merchantUpdate, hubConfigUpdate, menuDelete, socialDelete] = await Promise.all([
    supabase
      .from("merchants")
      .update({ google_review_link: googleReviewLink || null, phone: phone || null, opening_hours: openingHours })
      .eq("id", merchant.merchantId),
    supabase
      .from("merchant_hub_config")
      .upsert({ merchant_id: merchant.merchantId, enabled_tabs: enabledTabs, updated_at: new Date().toISOString() }),
    supabase.from("merchant_menu_items").delete().eq("merchant_id", merchant.merchantId),
    supabase.from("merchant_social_links").delete().eq("merchant_id", merchant.merchantId),
  ]);

  for (const { error } of [merchantUpdate, hubConfigUpdate, menuDelete, socialDelete]) {
    if (error) return { error: error.message };
  }

  if (menuItems.length > 0) {
    const { error } = await supabase.from("merchant_menu_items").insert(
      menuItems.map((item, position) => ({
        merchant_id: merchant.merchantId,
        name: item.name,
        description: item.description || null,
        price_cents: item.priceCents ?? null,
        position,
      }))
    );
    if (error) return { error: error.message };
  }

  if (socialLinks.length > 0) {
    const { error } = await supabase.from("merchant_social_links").insert(
      socialLinks.map((link, position) => ({
        merchant_id: merchant.merchantId,
        platform: link.platform,
        url: link.url,
        position,
      }))
    );
    if (error) return { error: error.message };
  }

  revalidatePath("/dashboard/hub");
  revalidatePath("/c", "layout");
  revalidatePath("/p", "layout");
  return { success: true };
}
