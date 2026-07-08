import { NextResponse } from "next/server";
import { buildLoyaltyPkPass } from "@/lib/wallet/apple/pkpass";
import { isAppleWalletConfigured } from "@/lib/env";

export const runtime = "nodejs";

// Public, unauthenticated: this is the link customers tap to add the card
// to Apple Wallet for the first time (from /c/[publicId]).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ serialNumber: string }> }
) {
  if (!isAppleWalletConfigured) {
    return NextResponse.json({ error: "Apple Wallet non configuré." }, { status: 503 });
  }

  const { serialNumber } = await params;
  const buffer = await buildLoyaltyPkPass(serialNumber);

  if (!buffer) {
    return NextResponse.json({ error: "Carte introuvable." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.apple.pkpass",
      "Content-Disposition": `attachment; filename="${serialNumber}.pkpass"`,
    },
  });
}
