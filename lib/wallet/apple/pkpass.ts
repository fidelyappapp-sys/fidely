import { PKPass } from "passkit-generator";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { signedQrPayload } from "@/lib/qr/generate";
import { appBaseUrl } from "@/lib/env";
import { suggestTextColor } from "@/lib/color";
import { hexToPassRgbString, generatePassAssets } from "./assets";

function certificates() {
  return {
    wwdr: Buffer.from(process.env.APPLE_WWDR_CERT!, "base64"),
    signerCert: Buffer.from(process.env.APPLE_SIGNER_CERT!, "base64"),
    signerKey: Buffer.from(process.env.APPLE_SIGNER_KEY!, "base64"),
    signerKeyPassphrase: process.env.APPLE_SIGNER_KEY_PASSPHRASE || undefined,
  };
}

// Builds a fresh, signed .pkpass for a loyalty card from its current state
// in the database. Always regenerated on demand (never cached) so the
// points shown are never stale.
export async function buildLoyaltyPkPass(serialNumber: string): Promise<Buffer | null> {
  const db = createServiceRoleClient();

  // Only columns guaranteed to exist since 0001_init.sql, plus
  // background_photo_url/enabled and text_color (0016/0021, both already
  // applied everywhere this runs) — pass generation must keep working
  // regardless of whether the notifications migration (last_push_message
  // etc.) has landed on this database yet, hence the separate query below.
  const { data: card } = await db
    .from("loyalty_cards")
    .select(
      "public_id, points, pass_serial_number, pass_auth_token, created_at, customers(full_name, phone), merchants(business_name, brand_color, text_color, logo_url, background_photo_url, background_photo_enabled), loyalty_programs(display_mode, reward_threshold, reward_description)"
    )
    .eq("pass_serial_number", serialNumber)
    .maybeSingle();

  if (!card) return null;

  // Best-effort, queried separately so a missing column can't take down
  // pass generation for every customer.
  const { data: messageRow } = await db
    .from("loyalty_cards")
    .select("last_push_message")
    .eq("pass_serial_number", serialNumber)
    .maybeSingle();

  const merchant = card.merchants as unknown as {
    business_name: string;
    brand_color: string;
    text_color: string | null;
    logo_url: string | null;
    background_photo_url: string | null;
    background_photo_enabled: boolean;
  } | null;
  const program = card.loyalty_programs as unknown as {
    display_mode: "stamps" | "points";
    reward_threshold: number;
    reward_description: string;
  } | null;
  const customer = card.customers as unknown as {
    full_name: string | null;
    phone: string | null;
  } | null;

  if (!merchant || !program) return null;

  const stripPhotoUrl = merchant.background_photo_enabled ? merchant.background_photo_url : null;
  const assets = await generatePassAssets(merchant.brand_color, merchant.logo_url, stripPhotoUrl);
  const textColorHex = merchant.text_color ?? suggestTextColor(merchant.brand_color);
  const memberSince = new Date(card.created_at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const pass = new PKPass({}, certificates(), {
    serialNumber: card.pass_serial_number,
    description: `${merchant.business_name} — carte de fidélité`,
    organizationName: merchant.business_name,
    passTypeIdentifier: process.env.APPLE_PASS_TYPE_ID!,
    teamIdentifier: process.env.APPLE_TEAM_ID!,
    webServiceURL: `${appBaseUrl()}/api/wallet/apple`,
    authenticationToken: card.pass_auth_token,
    backgroundColor: hexToPassRgbString(merchant.brand_color),
    foregroundColor: hexToPassRgbString(textColorHex),
    labelColor: hexToPassRgbString(textColorHex),
  });

  pass.type = "storeCard";

  const isStamps = program.display_mode === "stamps";

  // No headerField for the points/tampons count: storeCard's fixed layout
  // renders headerFields above the strip image, but the customizer's photo
  // banner is meant to end before that count, not behind it — so the count
  // only lives in secondaryFields below, and primaryFields (reward) is the
  // only text overlaid on the strip, same as a typical loyalty card photo.
  pass.primaryFields.push({
    key: "reward",
    label: "RÉCOMPENSE",
    value: program.reward_description,
  });

  pass.secondaryFields.push({
    key: "points",
    label: isStamps ? "Solde de tampons" : "Solde de points",
    value: card.points,
  });

  pass.auxiliaryFields.push({
    key: "threshold",
    label: "Objectif",
    value: `${program.reward_threshold} ${isStamps ? "tampons" : "points"}`,
  });

  // Generic notification channel: whoever wants to notify this customer
  // (scan side-effect, birthday cron, review-request cron, manual
  // broadcast) writes the exact sentence to `last_push_message` and
  // triggers a push. changeMessage "%@" makes iOS show that sentence
  // verbatim as the lock-screen notification once it differs from the
  // value the device already has cached.
  pass.backFields.push({
    key: "message",
    label: "Dernière notification",
    value: messageRow?.last_push_message ?? "Bienvenue chez " + merchant.business_name + " !",
    changeMessage: "%@",
  });

  if (customer?.full_name) {
    pass.backFields.push({ key: "customer-name", label: "Client", value: customer.full_name });
  }
  if (customer?.phone) {
    pass.backFields.push({ key: "customer-phone", label: "Téléphone", value: customer.phone });
  }
  pass.backFields.push({ key: "member-since", label: "Membre depuis", value: memberSince });

  pass.setBarcodes({
    format: "PKBarcodeFormatQR",
    message: signedQrPayload(card.public_id),
    messageEncoding: "iso-8859-1",
    altText: `${card.points} ${isStamps ? "tampons" : "points"}`,
  });

  for (const [path, buffer] of Object.entries(assets)) {
    pass.addBuffer(path, buffer);
  }

  return pass.getAsBuffer();
}
