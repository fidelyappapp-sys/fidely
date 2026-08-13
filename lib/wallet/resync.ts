import { createServiceRoleClient } from "@/lib/supabase/server";
import { isGoogleWalletConfigured } from "@/lib/env";
import { signedQrPayload } from "@/lib/qr/generate";
import { notifyAppleWalletUpdate } from "./apple/notify";
import { upsertLoyaltyClass, patchLoyaltyObjectProgramFields } from "./google/objects";

// Neither Apple nor Google Wallet re-renders an already-installed pass on
// its own once the merchant edits brand color, logo, or business name —
// Apple needs a push telling the device to re-fetch (buildLoyaltyPkPass
// rebuilds fresh, so that's enough on that side), and Google's loyaltyClass
// (shared by every customer of this merchant) needs to be re-PATCHed
// directly, since nothing else ever touches it after the first customer
// adds the card. Call this after any save that changes those fields.
export async function resyncMerchantWalletPasses(merchantId: string): Promise<void> {
  const db = createServiceRoleClient();

  const { data: cards } = await db
    .from("loyalty_cards")
    .select("pass_serial_number, google_object_id")
    .eq("merchant_id", merchantId);

  if (!cards || cards.length === 0) return;

  await Promise.allSettled(cards.map((card) => notifyAppleWalletUpdate(card.pass_serial_number)));

  const hasGoogleCard = cards.some((card) => card.google_object_id);
  if (!hasGoogleCard || !isGoogleWalletConfigured) return;

  const { data: merchant } = await db
    .from("merchants")
    .select("slug, business_name, brand_color, logo_url, background_photo_url, background_photo_enabled")
    .eq("id", merchantId)
    .maybeSingle();

  // upsertLoyaltyClass requires a logo — if the merchant has since removed
  // theirs there's nothing valid to resync to; leave the class as-is rather
  // than erroring the merchant's save over it.
  if (!merchant || !merchant.logo_url) return;

  try {
    await upsertLoyaltyClass({
      merchantSlug: merchant.slug,
      businessName: merchant.business_name,
      brandColorHex: merchant.brand_color,
      logoUrl: merchant.logo_url,
      backgroundPhotoUrl: merchant.background_photo_enabled ? merchant.background_photo_url : null,
    });
  } catch (err) {
    console.error("Google wallet class resync failed", err);
  }
}

// Re-syncs already-issued passes after the merchant changes the reward
// text, objectif, or stamps/points mode in one point of sale's program
// settings — nothing else ever revisits an existing Google object's
// textModulesData or secondaryLoyaltyPoints after it's first created, and
// Apple passes need the same re-fetch push as resyncMerchantWalletPasses
// above (the pass itself already rebuilds fresh with current program
// fields). Scoped by loyalty_program_id, not merchant_id — each point of
// sale now has its own program, so a merchant-wide resync here would
// overwrite other points of sale's cards with the wrong program values.
export async function resyncMerchantProgramFields(
  programId: string,
  program: { displayMode: "stamps" | "points"; rewardThreshold: number; rewardDescription: string }
): Promise<void> {
  const db = createServiceRoleClient();

  const { data: cards } = await db
    .from("loyalty_cards")
    .select("public_id, points, pass_serial_number, google_object_id, merchant_qr_codes(city)")
    .eq("loyalty_program_id", programId);

  if (!cards || cards.length === 0) return;

  await Promise.allSettled(cards.map((card) => notifyAppleWalletUpdate(card.pass_serial_number)));

  if (!isGoogleWalletConfigured) return;

  await Promise.allSettled(
    cards
      .filter((card): card is typeof card & { google_object_id: string } => Boolean(card.google_object_id))
      .map((card) => {
        const pointOfSale = card.merchant_qr_codes as unknown as { city: string | null } | null;
        return patchLoyaltyObjectProgramFields(card.google_object_id, {
          points: card.points,
          displayMode: program.displayMode,
          rewardThreshold: program.rewardThreshold,
          rewardDescription: program.rewardDescription,
          qrValue: signedQrPayload(card.public_id),
          // Must still be passed through here even though this resync is
          // about the program, not the city — see buildTextModulesData's
          // comment in google/objects.ts.
          city: pointOfSale?.city,
        }).catch((err) => console.error("Google wallet object program-field resync failed", err));
      })
  );
}

// Re-syncs already-issued passes after the merchant edits a single point of
// sale's city (e.g. filling in the "main" point of sale's city after the
// 0023 backfill, or correcting one later). Needs the point of sale's
// current program fields too, since a Google PATCH must resend the whole
// textModulesData array (see patchLoyaltyObjectProgramFields).
export async function resyncPointOfSaleCity(merchantQrCodeId: string, city: string): Promise<void> {
  const db = createServiceRoleClient();

  const { data: pos } = await db
    .from("merchant_qr_codes")
    .select("loyalty_programs(display_mode, reward_threshold, reward_description)")
    .eq("id", merchantQrCodeId)
    .maybeSingle();

  const program = pos?.loyalty_programs as unknown as {
    display_mode: "stamps" | "points";
    reward_threshold: number;
    reward_description: string;
  } | null;
  if (!program) return;

  const { data: cards } = await db
    .from("loyalty_cards")
    .select("public_id, points, pass_serial_number, google_object_id")
    .eq("merchant_qr_code_id", merchantQrCodeId);

  if (!cards || cards.length === 0) return;

  await Promise.allSettled(cards.map((card) => notifyAppleWalletUpdate(card.pass_serial_number)));

  if (!isGoogleWalletConfigured) return;

  await Promise.allSettled(
    cards
      .filter((card): card is typeof card & { google_object_id: string } => Boolean(card.google_object_id))
      .map((card) =>
        patchLoyaltyObjectProgramFields(card.google_object_id, {
          points: card.points,
          displayMode: program.display_mode,
          rewardThreshold: program.reward_threshold,
          rewardDescription: program.reward_description,
          qrValue: signedQrPayload(card.public_id),
          city,
        }).catch((err) => console.error("Google wallet object city resync failed", err))
      )
  );
}
