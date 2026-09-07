import { NextResponse } from "next/server";
import { z } from "zod";
import { getAnonymousOwnedPlaqueCount } from "@/lib/boutique.server";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";

const schema = z.object({ email: z.string().email() });

// Lets the public /avis-google form show the correct degressive price
// (lifetime cumulative by email) before the buyer submits the checkout —
// otherwise the price shown could differ from the price actually charged.
// Only ever returns a count, but still rate-limited since it accepts an
// arbitrary email from an anonymous caller.
export async function POST(request: Request) {
  const { allowed } = await checkRateLimit({
    bucketKey: `plaque_owned_count:${clientIp(request)}`,
    limit: 30,
    windowSeconds: 60,
  });
  if (!allowed) {
    return NextResponse.json({ error: "Trop de tentatives, réessayez plus tard." }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const ownedCount = await getAnonymousOwnedPlaqueCount(parsed.data.email);
  return NextResponse.json({ ownedCount });
}
