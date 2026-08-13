import apn from "@parse/node-apn";

let providerSingleton: apn.Provider | null = null;

function getProvider(): apn.Provider {
  if (!providerSingleton) {
    providerSingleton = new apn.Provider({
      cert: Buffer.from(process.env.APPLE_SIGNER_CERT!, "base64").toString("utf8"),
      key: Buffer.from(process.env.APPLE_SIGNER_KEY!, "base64").toString("utf8"),
      passphrase: process.env.APPLE_SIGNER_KEY_PASSPHRASE || undefined,
      // Always true: a Pass Type ID certificate has no sandbox variant —
      // node-apn's own cert validation throws synchronously ("certificate
      // does not support configured environment") if this is false, which
      // happened on every local `next dev` run since NODE_ENV isn't
      // "production" there.
      production: true,
    });
  }
  return providerSingleton;
}

// PassKit pass updates use an empty "silent" push — the payload carries no
// alert; it just tells the device to re-fetch the pass via
// GET /v1/passes/{passTypeIdentifier}/{serialNumber}. The lock-screen
// banner text comes from the pass's own `changeMessage` field, not from
// this push payload.
export async function sendApplePassPush(pushToken: string): Promise<void> {
  const notification = new apn.Notification();
  notification.topic = process.env.APPLE_PASS_TYPE_ID!;
  notification.payload = {};
  notification.pushType = "background";
  notification.contentAvailable = true;

  const result = await getProvider().send(notification, pushToken);
  if (result.failed.length > 0) {
    throw new Error(
      `APNs push failed: ${result.failed.map((f) => f.response?.reason ?? f.status).join(", ")}`
    );
  }
}
