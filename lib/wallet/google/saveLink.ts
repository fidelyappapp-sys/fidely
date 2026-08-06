import { importPKCS8, SignJWT } from "jose";
import { appBaseUrl } from "@/lib/env";
import { googleWalletServiceAccountCredentials } from "./auth";

// Builds the signed "Save to Google Wallet" JWT and returns the save URL.
// Signed locally with the service account's own private key — no
// iamcredentials.googleapis.com round trip needed once a real key exists.
// See https://developers.google.com/wallet/retail/loyalty-cards/web#add-to-google-wallet
export async function buildGoogleWalletSaveUrl(objectId: string, classId: string): Promise<string> {
  const { client_email, private_key } = googleWalletServiceAccountCredentials();
  const key = await importPKCS8(private_key, "RS256");

  const signedJwt = await new SignJWT({
    aud: "google",
    typ: "savetowallet",
    origins: [appBaseUrl()],
    payload: {
      loyaltyObjects: [{ id: objectId, classId }],
    },
  })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer(client_email)
    .setIssuedAt()
    .sign(key);

  return `https://pay.google.com/gp/v/save/${signedJwt}`;
}
