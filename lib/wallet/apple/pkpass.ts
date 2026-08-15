import { PKPass } from "passkit-generator";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { signedQrPayload } from "@/lib/qr/generate";
import { appBaseUrl } from "@/lib/env";
import { suggestTextColor } from "@/lib/color";
import {
  resolveCardDesign,
  POINT_OF_SALE_DESIGN_FIELDS,
  MERCHANT_DESIGN_FIELDS,
  type PointOfSaleDesignRow,
  type MerchantDesignRow,
} from "@/lib/wallet/design";
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
      `public_id, points, pass_serial_number, pass_auth_token, created_at, customers(full_name, phone), merchants(${MERCHANT_DESIGN_FIELDS}), loyalty_programs(display_mode, reward_threshold, reward_description), merchant_qr_codes(city, ${POINT_OF_SALE_DESIGN_FIELDS})`
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

  const merchant = card.merchants as unknown as MerchantDesignRow | null;
  const program = card.loyalty_programs as unknown as {
    display_mode: "stamps" | "points";
    reward_threshold: number;
    reward_description: string;
  } | null;
  const pointOfSale = card.merchant_qr_codes as unknown as
    | (PointOfSaleDesignRow & { city: string | null })
    | null;
  const customer = card.customers as unknown as {
    full_name: string | null;
    phone: string | null;
  } | null;

  if (!merchant || !program) return null;

  // Falls back to the merchant's own design when this point of sale hasn't
  // customized its own (see supabase/migrations/0024_pos_card_design.sql).
  const design = resolveCardDesign(pointOfSale, merchant);

  const stripPhotoUrl = design.backgroundPhotoEnabled ? design.backgroundPhotoUrl : null;
  const assets = await generatePassAssets(design.brandColor, design.logoUrl, stripPhotoUrl);
  const textColorHex = design.textColor ?? suggestTextColor(design.brandColor);
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
    backgroundColor: hexToPassRgbString(design.brandColor),
    foregroundColor: hexToPassRgbString(textColorHex),
    labelColor: hexToPassRgbString(textColorHex),
  });

  pass.type = "storeCard";

  const isStamps = program.display_mode === "stamps";

  // headerFields renders above the strip image. Deliberately left empty for
  // the points/tampons count (the customizer's photo banner is meant to end
  // before that count, not behind it — see secondaryFields below) — but a
  // short city name is exactly what this slot is for on a typical loyalty
  // card, and it's the only way to tell apart two cards from the same
  // merchant's different points of sale in the wallet app.
  if (pointOfSale?.city) {
    pass.headerFields.push({ key: "city", label: "", value: pointOfSale.city });
  }

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
