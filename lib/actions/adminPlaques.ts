"use server";

import { revalidatePath } from "next/cache";
import { requireAdminContext } from "@/lib/adminAuth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { assignPlaqueSchema } from "@/lib/validation/schemas";
import type { PlaqueMenuConfig, StandalonePlaqueTabKey } from "@/lib/supabase/types";

export interface AssignPlaqueActionState {
  error?: string;
  success?: boolean;
}

export async function assignPlaqueCode(
  code: string,
  _prevState: AssignPlaqueActionState,
  formData: FormData
): Promise<AssignPlaqueActionState> {
  await requireAdminContext();

  const tier = formData.get("tier");
  const parsed = assignPlaqueSchema.safeParse({
    tier,
    merchantName: formData.get("merchantName"),
    merchantAddress: formData.get("merchantAddress"),
    googlePlaceId: formData.get("googlePlaceId"),
    redirectUrl: formData.get("redirectUrl"),
    enabledTabs: formData.getAll("enabledTabs") as StandalonePlaqueTabKey[],
    loyaltyEnabled: formData.get("loyaltyEnabled") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const db = createServiceRoleClient();

  const menuConfig: PlaqueMenuConfig | null =
    parsed.data.tier === "avis" ? null : { enabledTabs: parsed.data.enabledTabs };

  const { error, data } = await db
    .from("plaques")
    .update({
      tier: parsed.data.tier,
      merchant_name: parsed.data.merchantName,
      merchant_address: parsed.data.merchantAddress || null,
      google_place_id: parsed.data.googlePlaceId || null,
      redirect_url: parsed.data.tier === "avis" ? parsed.data.redirectUrl : null,
      loyalty_enabled: parsed.data.tier === "pro" ? (parsed.data.loyaltyEnabled ?? false) : false,
      menu_config: menuConfig,
    })
    .eq("short_code", code)
    .is("merchant_id", null)
    .select("short_code")
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "Code introuvable ou déjà rattaché à un compte commerçant." };

  revalidatePath("/admin/plaques");
  revalidatePath(`/admin/plaques/${code}`);
  revalidatePath(`/p/${code}`);
  return { success: true };
}
