import { createHmac, timingSafeEqual } from "node:crypto";

export interface VerifiedQr {
  publicId: string;
}

// Verifies a "<public_id>.<hmac>" payload produced by signedQrPayload().
// Returns null if the payload is malformed or the signature doesn't match,
// so callers never need to trust a scanned QR / pasted barcode value.
export function verifyQrPayload(payload: string): VerifiedQr | null {
  const secret = process.env.QR_SIGNING_SECRET;
  if (!secret) throw new Error("QR_SIGNING_SECRET is not set");

  const separatorIndex = payload.lastIndexOf(".");
  if (separatorIndex === -1) return null;

  const publicId = payload.slice(0, separatorIndex);
  const providedSig = payload.slice(separatorIndex + 1);

  const expectedSig = createHmac("sha256", secret).update(publicId).digest("hex").slice(0, 32);

  const provided = Buffer.from(providedSig);
  const expected = Buffer.from(expectedSig);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null;
  }

  return { publicId };
}
