import { googleWalletAccessToken } from "./auth";

const WALLET_API_BASE = "https://walletobjects.googleapis.com/walletobjects/v1";

function issuerId(): string {
  return process.env.GOOGLE_WALLET_ISSUER_ID!;
}

export function loyaltyClassId(merchantSlug: string): string {
  return `${issuerId()}.${merchantSlug.replace(/[^a-zA-Z0-9_-]/g, "_")}_program`;
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

// Ensures a loyaltyClass exists for the merchant's program (idempotent:
// insert, and if it already exists — 409 — fall back to update).
export async function upsertLoyaltyClass(params: {
  merchantSlug: string;
  businessName: string;
  brandColorHex: string;
  rewardDescription: string;
}): Promise<string> {
  const id = loyaltyClassId(params.merchantSlug);
  const body = {
    id,
    issuerName: params.businessName,
    programName: params.businessName,
    programLogo: undefined,
    hexBackgroundColor: params.brandColorHex,
    reviewStatus: "UNDER_REVIEW",
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

// Ensures a loyaltyObject exists for this specific customer card.
export async function upsertLoyaltyObject(params: {
  classId: string;
  publicId: string;
  points: number;
  rewardThreshold: number;
  rewardDescription: string;
  qrValue: string;
}): Promise<string> {
  const id = loyaltyObjectId(params.publicId);
  const body = {
    id,
    classId: params.classId,
    state: "ACTIVE",
    loyaltyPoints: {
      label: "Points",
      balance: { int: params.points },
    },
    barcode: { type: "QR_CODE", value: params.qrValue },
    textModulesData: [
      {
        header: "Récompense",
        body: `${params.rewardThreshold} points = ${params.rewardDescription}`,
      },
    ],
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
export async function patchLoyaltyObjectPoints(
  objectId: string,
  points: number,
  message?: { header: string; body: string }
): Promise<void> {
  const res = await walletRequest(`/loyaltyObject/${objectId}`, {
    method: "PATCH",
    body: JSON.stringify({
      loyaltyPoints: { label: "Points", balance: { int: points } },
      messages: [
        {
          header: message?.header ?? "Points mis à jour",
          body: message?.body ?? `Vous avez maintenant ${points} points.`,
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
