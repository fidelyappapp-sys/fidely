import { PKPass } from "passkit-generator";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { signedQrPayload } from "@/lib/qr/generate";
import { appBaseUrl } from "@/lib/env";
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

  // Only columns guaranteed to exist since 0001_init.sql — pass generation
  // must keep working regardless of whether the notifications migration
  // (last_push_message etc.) has landed on this database yet.
  const { data: card } = await db
    .from("loyalty_cards")
    .select(
      "public_id, points, pass_serial_number, pass_auth_token, merchants(business_name, brand_color), loyalty_programs(reward_threshold, reward_description)"
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
  } | null;
  const program = card.loyalty_programs as unknown as {
    reward_threshold: number;
    reward_description: string;
  } | null;

  if (!merchant || !program) return null;

  const assets = await generatePassAssets(merchant.brand_color);

  const pass = new PKPass({}, certificates(), {
    serialNumber: card.pass_serial_number,
    description: `${merchant.business_name} — carte de fidélité`,
    organizationName: merchant.business_name,
    passTypeIdentifier: process.env.APPLE_PASS_TYPE_ID!,
    teamIdentifier: process.env.APPLE_TEAM_ID!,
    webServiceURL: `${appBaseUrl()}/api/wallet/apple`,
    authenticationToken: card.pass_auth_token,
    backgroundColor: hexToPassRgbString(merchant.brand_color),
    foregroundColor: "rgb(255, 255, 255)",
    labelColor: "rgb(255, 255, 255)",
  });

  pass.type = "storeCard";

  pass.headerFields.push({
    key: "points-header",
    label: "POINTS",
    value: card.points,
  });

  pass.primaryFields.push({
    key: "reward",
    label: "RÉCOMPENSE",
    value: program.reward_description,
  });

  pass.secondaryFields.push({
    key: "points",
    label: "Solde de points",
    value: card.points,
  });

  pass.auxiliaryFields.push({
    key: "threshold",
    label: "Objectif",
    value: `${program.reward_threshold} points`,
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

  pass.setBarcodes({
    format: "PKBarcodeFormatQR",
    message: signedQrPayload(card.public_id),
    messageEncoding: "iso-8859-1",
    altText: `${card.points} points`,
  });

  for (const [path, buffer] of Object.entries(assets)) {
    pass.addBuffer(path, buffer);
  }

  return pass.getAsBuffer();
}
