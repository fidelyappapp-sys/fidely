import { createHmac } from "node:crypto";
import QRCode from "qrcode";

function sign(publicId: string): string {
  const secret = process.env.QR_SIGNING_SECRET;
  if (!secret) throw new Error("QR_SIGNING_SECRET is not set");
  return createHmac("sha256", secret).update(publicId).digest("hex").slice(0, 32);
}

// The payload embedded in the QR code / pass barcode: "<public_id>.<hmac>".
// Verified server-side in lib/qr/verify.ts before any points are awarded.
export function signedQrPayload(publicId: string): string {
  return `${publicId}.${sign(publicId)}`;
}

export async function qrCodeDataUrl(publicId: string): Promise<string> {
  return QRCode.toDataURL(signedQrPayload(publicId), {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320,
  });
}
