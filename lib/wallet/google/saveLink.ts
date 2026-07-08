import { SignJWT, importPKCS8 } from "jose";
import { appBaseUrl } from "@/lib/env";
import { googleWalletServiceAccountEmail, googleWalletPrivateKey } from "./auth";

// Builds the signed "Save to Google Wallet" JWT and returns the save URL.
// See https://developers.google.com/wallet/retail/loyalty-cards/web#add-to-google-wallet
export async function buildGoogleWalletSaveUrl(objectId: string, classId: string): Promise<string> {
  const privateKey = await importPKCS8(googleWalletPrivateKey(), "RS256");

  const jwt = await new SignJWT({
    aud: "google",
    typ: "savetowallet",
    origins: [appBaseUrl()],
    payload: {
      loyaltyObjects: [{ id: objectId, classId }],
    },
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuedAt()
    .setIssuer(googleWalletServiceAccountEmail())
    .sign(privateKey);

  return `https://pay.google.com/gp/v/save/${jwt}`;
}
