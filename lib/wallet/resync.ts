import { createServiceRoleClient } from "@/lib/supabase/server";
import { isGoogleWalletConfigured } from "@/lib/env";
import { signedQrPayload } from "@/lib/qr/generate";
import { notifyAppleWalletUpdate } from "./apple/notify";
import { upsertLoyaltyClass, patchLoyaltyObjectProgramFields } from "./google/objects";

// Neither Apple nor Google Wallet re-renders an already-installed pass on
// its own once the merchant edits a point of sale's brand color, logo, or
// display name — Apple needs a push telling the device to re-fetch
// (buildLoyaltyPkPass rebuilds fresh, so that's enough on that side), and
// Google's loyaltyClass needs to be re-PATCHed directly, since nothing else
// ever touches it after the first customer adds a card. Scoped by point of
// sale (merchant_qr_code_id), not merchant_id — each point of sale has its
// own design and its own Google Wallet class since 0024_pos_card_design.sql,
// so a merchant-wide resync here would push one point of sale's look onto
// another's cards. Call this after any card-design save.
export async function resyncPointOfSaleWalletPasses(posId: string): Promise<void> {
  const db = createServiceRoleClient();

  const { data: cards } = await db
    .from("loyalty_cards")
    .select("pass_serial_number, google_object_id")
    .eq("merchant_qr_code_id", posId);

  if (!cards || cards.length === 0) return;

  await Promise.allSettled(cards.map((card) => notifyAppleWalletUpdate(card.pass_serial_number)));

  const hasGoogleCard = cards.some((card) => card.google_object_id);
  if (!hasGoogleCard || !isGoogleWalletConfigured) return;

  const { data: pos } = await db
    .from("merchant_qr_codes")
    .select(
      "brand_color, logo_url, background_photo_url, background_photo_enabled, merchants(business_name, brand_color, logo_url, background_photo_url, background_photo_enabled)"
    )
    .eq("id", posId)
    .maybeSingle();

  const merchant = pos?.merchants as unknown as {
    business_name: string;
    brand_color: string;
    logo_url: string | null;
    background_photo_url: string | null;
    background_photo_enabled: boolean;
  } | null;
  if (!pos || !merchant) return;

  const brandColorHex = pos.brand_color ?? merchant.brand_color;
  const logoUrl = pos.logo_url ?? merchant.logo_url;
  const backgroundPhotoEnabled = pos.background_photo_enabled ?? merchant.background_photo_enabled;
  const backgroundPhotoUrl = pos.background_photo_url ?? merchant.background_photo_url;

  // upsertLoyaltyClass requires a logo — if neither the point of sale nor
  // the merchant has one configured there's nothing valid to resync to;
  // leave the class as-is rather than erroring the merchant's save over it.
  if (!logoUrl) return;

  try {
    await upsertLoyaltyClass({
      pointOfSaleId: posId,
      businessName: merchant.business_name,
      brandColorHex,
      logoUrl,
      backgroundPhotoUrl: backgroundPhotoEnabled ? backgroundPhotoUrl : null,
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
