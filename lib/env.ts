// Central feature-flag helpers. Wallet integrations are fully implemented
// against the real APIs but stay hidden in the UI / no-op server-side until
// their credentials are actually configured (see docs/WALLET_SETUP.md).

export const isAppleWalletConfigured = Boolean(
  process.env.APPLE_PASS_TYPE_ID &&
    process.env.APPLE_TEAM_ID &&
    process.env.APPLE_WWDR_CERT &&
    process.env.APPLE_SIGNER_CERT &&
    process.env.APPLE_SIGNER_KEY
);

export const isGoogleWalletConfigured = Boolean(
  process.env.GOOGLE_WALLET_ISSUER_ID &&
    process.env.GCP_PROJECT_NUMBER &&
    process.env.GCP_WORKLOAD_IDENTITY_POOL_ID &&
    process.env.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID &&
    process.env.GCP_SERVICE_ACCOUNT_EMAIL
);

export const isStripeConfigured = Boolean(
  process.env.STRIPE_SECRET_KEY && process.env.STRIPE_METERED_PRICE_ID
);

export const isWebPushConfigured = Boolean(
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY
);

export const isEmailConfigured = Boolean(process.env.RESEND_API_KEY);

export function appBaseUrl() {
  return process.env.APP_BASE_URL ?? "http://localhost:3000";
}
