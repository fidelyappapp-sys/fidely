import { GoogleAuth } from "google-auth-library";

let authSingleton: GoogleAuth | null = null;

function getAuth(): GoogleAuth {
  if (!authSingleton) {
    const credentials = JSON.parse(
      Buffer.from(process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON!, "base64").toString("utf8")
    );
    authSingleton = new GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/wallet_object.issuer"],
    });
  }
  return authSingleton;
}

export async function googleWalletAccessToken(): Promise<string> {
  const client = await getAuth().getClient();
  const { token } = await client.getAccessToken();
  if (!token) throw new Error("Failed to obtain Google Wallet access token");
  return token;
}

export function googleWalletServiceAccountEmail(): string {
  const credentials = JSON.parse(
    Buffer.from(process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON!, "base64").toString("utf8")
  );
  return credentials.client_email;
}

export function googleWalletPrivateKey(): string {
  const credentials = JSON.parse(
    Buffer.from(process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON!, "base64").toString("utf8")
  );
  return credentials.private_key;
}
