import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Apple PassKit Web Service: devices POST error logs here. No auth per
// Apple's spec — just accept and log server-side for debugging.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const logs = Array.isArray(body?.logs) ? body.logs : [];
  for (const line of logs) {
    console.warn("[apple-wallet-device-log]", line);
  }
  return NextResponse.json({}, { status: 200 });
}
