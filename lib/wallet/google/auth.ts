import { getVercelOidcToken } from "@vercel/oidc";
import { BaseExternalAccountClient, ExternalAccountClient } from "google-auth-library";

let clientSingleton: BaseExternalAccountClient | null = null;

// GCP's "default audience" for this provider — see docs/WALLET_SETUP.md.
function audience(): string {
  const projectNumber = process.env.GCP_PROJECT_NUMBER!;
  const poolId = process.env.GCP_WORKLOAD_IDENTITY_POOL_ID!;
  const providerId = process.env.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID!;
  return `https://iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${poolId}/providers/${providerId}`;
}

// Exchanges a Vercel OIDC token for short-lived Google credentials via
// Workload Identity Federation — no service account key ever exists.
function getClient(): BaseExternalAccountClient {
  if (!clientSingleton) {
    const aud = audience();
    const client = ExternalAccountClient.fromJSON({
      type: "external_account",
      audience: aud,
      subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
      token_url: "https://sts.googleapis.com/v1/token",
      service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${process.env.GCP_SERVICE_ACCOUNT_EMAIL}:generateAccessToken`,
      subject_token_supplier: {
        getSubjectToken: () => getVercelOidcToken({ audience: aud }),
      },
    });
    if (!client) throw new Error("Failed to build Google Wallet external account client");
    clientSingleton = client;
  }
  return clientSingleton;
}

export async function googleWalletAccessToken(): Promise<string> {
  const { token } = await getClient().getAccessToken();
  if (!token) throw new Error("Failed to obtain Google Wallet access token");
  return token;
}
