import { getVercelOidcToken } from "@vercel/oidc";
import { BaseExternalAccountClient, ExternalAccountClient } from "google-auth-library";

let clientSingleton: BaseExternalAccountClient | null = null;

function providerPath(): string {
  const projectNumber = process.env.GCP_PROJECT_NUMBER!;
  const poolId = process.env.GCP_WORKLOAD_IDENTITY_POOL_ID!;
  const providerId = process.env.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID!;
  return `projects/${projectNumber}/locations/global/workloadIdentityPools/${poolId}/providers/${providerId}`;
}

// Exchanges a Vercel OIDC token for short-lived Google credentials via
// Workload Identity Federation — no service account key ever exists.
function getClient(): BaseExternalAccountClient {
  if (!clientSingleton) {
    const path = providerPath();
    // The STS token exchange wants the provider's bare resource name...
    const stsAudience = `//iam.googleapis.com/${path}`;
    // ...but the OIDC token's own `aud` claim (GCP's "default audience" for
    // this provider) must carry the full URL.
    const tokenAudience = `https://iam.googleapis.com/${path}`;

    const client = ExternalAccountClient.fromJSON({
      type: "external_account",
      audience: stsAudience,
      subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
      token_url: "https://sts.googleapis.com/v1/token",
      service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${process.env.GCP_SERVICE_ACCOUNT_EMAIL}:generateAccessToken`,
      subject_token_supplier: {
        getSubjectToken: () => getVercelOidcToken({ audience: tokenAudience }),
      },
      // wallet_object.issuer for the Wallet Objects API calls in objects.ts,
      // cloud-platform for the IAM Credentials signJwt call in saveLink.ts.
      scopes: [
        "https://www.googleapis.com/auth/wallet_object.issuer",
        "https://www.googleapis.com/auth/cloud-platform",
      ],
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
