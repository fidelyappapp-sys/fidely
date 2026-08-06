import { JWT } from "google-auth-library";

let clientSingleton: JWT | null = null;
let credentialsSingleton: { client_email: string; private_key: string } | null = null;

// Service account key JSON (base64-encoded, same convention as
// APPLE_SIGNER_CERT/APPLE_SIGNER_KEY) used directly — no Workload Identity
// Federation. Whether key creation is possible at all depends on the GCP
// project's org policy (see docs/WALLET_SETUP.md).
function credentials(): { client_email: string; private_key: string } {
  if (!credentialsSingleton) {
    const json = Buffer.from(process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_KEY!, "base64").toString(
      "utf8"
    );
    const parsed = JSON.parse(json) as { client_email: string; private_key: string };
    credentialsSingleton = { client_email: parsed.client_email, private_key: parsed.private_key };
  }
  return credentialsSingleton;
}

function getClient(): JWT {
  if (!clientSingleton) {
    const { client_email, private_key } = credentials();
    clientSingleton = new JWT({
      email: client_email,
      key: private_key,
      scopes: ["https://www.googleapis.com/auth/wallet_object.issuer"],
    });
  }
  return clientSingleton;
}

export async function googleWalletAccessToken(): Promise<string> {
  const { token } = await getClient().getAccessToken();
  if (!token) throw new Error("Failed to obtain Google Wallet access token");
  return token;
}

// Used by saveLink.ts to sign the "Save to Google Wallet" JWT locally with
// the same key, instead of calling the IAM Credentials signJwt API.
export function googleWalletServiceAccountCredentials(): {
  client_email: string;
  private_key: string;
} {
  return credentials();
}
