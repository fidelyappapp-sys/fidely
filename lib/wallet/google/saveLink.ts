import { appBaseUrl } from "@/lib/env";
import { googleWalletAccessToken } from "./auth";

// Builds the signed "Save to Google Wallet" JWT and returns the save URL.
// Signing happens via the IAM Credentials API instead of a local private
// key, since no service account key exists (see docs/WALLET_SETUP.md).
// See https://developers.google.com/wallet/retail/loyalty-cards/web#add-to-google-wallet
export async function buildGoogleWalletSaveUrl(objectId: string, classId: string): Promise<string> {
  const serviceAccountEmail = process.env.GCP_SERVICE_ACCOUNT_EMAIL!;
  const claims = {
    iss: serviceAccountEmail,
    aud: "google",
    typ: "savetowallet",
    iat: Math.floor(Date.now() / 1000),
    origins: [appBaseUrl()],
    payload: {
      loyaltyObjects: [{ id: objectId, classId }],
    },
  };

  const token = await googleWalletAccessToken();
  const res = await fetch(
    `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${serviceAccountEmail}:signJwt`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ payload: JSON.stringify(claims) }),
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to sign Google Wallet save JWT: ${await res.text()}`);
  }

  const { signedJwt } = (await res.json()) as { signedJwt: string };
  return `https://pay.google.com/gp/v/save/${signedJwt}`;
}
