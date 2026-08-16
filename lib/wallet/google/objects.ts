import { googleWalletAccessToken } from "./auth";

const WALLET_API_BASE = "https://walletobjects.googleapis.com/walletobjects/v1";

function issuerId(): string {
  return process.env.GOOGLE_WALLET_ISSUER_ID!;
}

// Keyed by point of sale, not merchant — each point of sale gets its own
// Google Wallet class since 0024_pos_card_design.sql, so its design (color,
// logo, background) can differ from other points of sale of the same
// merchant.
export function loyaltyClassId(pointOfSaleId: string): string {
  return `${issuerId()}.${pointOfSaleId.replace(/[^a-zA-Z0-9_-]/g, "_")}_program`;
}

export function loyaltyObjectId(publicId: string): string {
  return `${issuerId()}.${publicId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

async function walletRequest(path: string, init: RequestInit) {
  const token = await googleWalletAccessToken();
  const res = await fetch(`${WALLET_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  return res;
}

// Ensures a loyaltyClass exists for this point of sale (idempotent: insert,
// and if it already exists — 409 — fall back to update).
export async function upsertLoyaltyClass(params: {
  pointOfSaleId: string;
  businessName: string;
  // The loyalty program's own name (see loyalty_programs.name, "Nom du
  // programme" on the Programme page) — shown as the card's title and as
  // the bold header on Google Wallet notifications. Distinct from
  // businessName: a merchant with several points of sale can run a
  // differently-named program at each, and "programName" is what actually
  // identifies which one a notification is about — businessName alone
  // (same across every point of sale) can't.
  programName: string;
  brandColorHex: string;
  logoUrl: string | null;
  // Google's equivalent of a card background photo — a banner shown on the
  // front of the card. Apple has no directly equivalent field in the ones
  // this app currently uses, so background photos only reach the pass on
  // this platform for now.
  backgroundPhotoUrl?: string | null;
}): Promise<string> {
  if (!params.logoUrl) {
    throw new Error(
      `Google Wallet requires a program logo; point of sale "${params.pointOfSaleId}" has none configured (Paramètres → Logo).`
    );
  }

  const id = loyaltyClassId(params.pointOfSaleId);
  const body = {
    id,
    issuerName: params.businessName,
    programName: params.programName,
    programLogo: { sourceUri: { uri: params.logoUrl } },
    hexBackgroundColor: params.brandColorHex,
    reviewStatus: "UNDER_REVIEW",
    ...(params.backgroundPhotoUrl
      ? { heroImage: { sourceUri: { uri: params.backgroundPhotoUrl } } }
      : {}),
  };

  const insertRes = await walletRequest("/loyaltyClass", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (insertRes.ok) return id;
  if (insertRes.status !== 409) {
    throw new Error(`Failed to create Google loyaltyClass: ${await insertRes.text()}`);
  }

  const updateRes = await walletRequest(`/loyaltyClass/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  if (!updateRes.ok) {
    throw new Error(`Failed to update Google loyaltyClass: ${await updateRes.text()}`);
  }
  return id;
}

function pointsLabel(displayMode: "stamps" | "points"): string {
  return displayMode === "stamps" ? "Tampons" : "Points";
}

// textModulesData is always sent in full (never a single new entry) — a
// Wallet Objects PATCH replaces the whole array rather than merging by
// entry, so every call site that touches it must include every module that
// should still be there afterwards.
function buildTextModulesData(
  rewardThreshold: number,
  rewardDescription: string,
  label: string,
  city?: string | null
) {
  return [
    { header: "Récompense", body: `${rewardThreshold} ${label.toLowerCase()} = ${rewardDescription}` },
    ...(city ? [{ header: "Point de vente", body: city }] : []),
  ];
}

// Ensures a loyaltyObject exists for this specific customer card.
export async function upsertLoyaltyObject(params: {
  classId: string;
  publicId: string;
  points: number;
  displayMode: "stamps" | "points";
  rewardThreshold: number;
  rewardDescription: string;
  qrValue: string;
  // The point of sale's city, shown as a second text module so a customer
  // with cards from several points of sale of the same merchant can tell
  // them apart. Omitted (no module) when the point of sale has none set.
  city?: string | null;
}): Promise<string> {
  const id = loyaltyObjectId(params.publicId);
  const label = pointsLabel(params.displayMode);
  const body = {
    id,
    classId: params.classId,
    state: "ACTIVE",
    loyaltyPoints: {
      label,
      balance: { int: params.points },
    },
    // Direct equivalent of the Apple pass's auxiliaryFields "Objectif" —
    // rendered by Google Wallet alongside the primary loyaltyPoints.
    secondaryLoyaltyPoints: {
      label: "Objectif",
      balance: { int: params.rewardThreshold },
    },
    barcode: {
      type: "QR_CODE",
      value: params.qrValue,
      // Equivalent of the Apple pass's barcode altText — the points/stamps
      // count shown just beneath the QR code.
      alternateText: `${params.points} ${label.toLowerCase()}`,
    },
    textModulesData: buildTextModulesData(params.rewardThreshold, params.rewardDescription, label, params.city),
  };

  const insertRes = await walletRequest("/loyaltyObject", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (insertRes.ok) return id;
  if (insertRes.status !== 409) {
    throw new Error(`Failed to create Google loyaltyObject: ${await insertRes.text()}`);
  }
  return id;
}

// Called after a scan awards points: patches the balance and appends a
// message, which is what causes Google Wallet to notify the device.
// loyaltyPoints.label and barcode are sent in full on every call (not just
// balance/alternateText) — Wallet Objects PATCH semantics for nested
// sub-objects aren't documented as a field-level merge, so relying on that
// to "preserve" a previously-set label/barcode risked a stamps-mode card
// silently reverting to "Points" (and a stale points count under the QR)
// on the very next scan.
export async function patchLoyaltyObjectPoints(
  objectId: string,
  points: number,
  displayMode: "stamps" | "points",
  qrValue: string,
  message?: { header: string; body: string }
): Promise<void> {
  const label = pointsLabel(displayMode);
  const res = await walletRequest(`/loyaltyObject/${objectId}`, {
    method: "PATCH",
    body: JSON.stringify({
      loyaltyPoints: { label, balance: { int: points } },
      barcode: { type: "QR_CODE", value: qrValue, alternateText: `${points} ${label.toLowerCase()}` },
      messages: [
        {
          header: message?.header ?? `${label} mis à jour`,
          body: message?.body ?? `Vous avez maintenant ${points} ${label.toLowerCase()}.`,
          id: `points-${points}-${Date.now()}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to patch Google loyaltyObject: ${await res.text()}`);
  }
}

// Pushes a standalone message (birthday, review request, manual broadcast)
// without touching the points balance. Wallet Objects PATCH only updates
// the fields provided, so omitting loyaltyPoints leaves it untouched.
export async function pushLoyaltyObjectMessage(
  objectId: string,
  header: string,
  body: string
): Promise<void> {
  const res = await walletRequest(`/loyaltyObject/${objectId}`, {
    method: "PATCH",
    body: JSON.stringify({
      messages: [{ header, body, id: `msg-${Date.now()}` }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to push Google loyaltyObject message: ${await res.text()}`);
  }
}

// Re-syncs the reward/objectif text and points label on an already-issued
// object — nothing else ever revisits textModulesData/secondaryLoyaltyPoints
// after the object is first created, so a merchant changing the reward
// description or stamps/points mode would otherwise leave every existing
// customer's card showing the old reward forever. Takes the card's current
// `points` and re-sends the full loyaltyPoints/barcode sub-objects rather
// than just the changed keys, for the same partial-merge-safety reason as
// patchLoyaltyObjectPoints above.
export async function patchLoyaltyObjectProgramFields(
  objectId: string,
  params: {
    points: number;
    displayMode: "stamps" | "points";
    rewardThreshold: number;
    rewardDescription: string;
    qrValue: string;
    // Must be passed through even when only the program (not the city)
    // changed — omitting it would wipe the existing city module, since this
    // PATCH replaces textModulesData wholesale rather than merging entries.
    city?: string | null;
  }
): Promise<void> {
  const label = pointsLabel(params.displayMode);
  const res = await walletRequest(`/loyaltyObject/${objectId}`, {
    method: "PATCH",
    body: JSON.stringify({
      loyaltyPoints: { label, balance: { int: params.points } },
      secondaryLoyaltyPoints: { label: "Objectif", balance: { int: params.rewardThreshold } },
      barcode: {
        type: "QR_CODE",
        value: params.qrValue,
        alternateText: `${params.points} ${label.toLowerCase()}`,
      },
      textModulesData: buildTextModulesData(params.rewardThreshold, params.rewardDescription, label, params.city),
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to patch Google loyaltyObject program fields: ${await res.text()}`);
  }
}
