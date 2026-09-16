import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// vCard 3.0 requires ',', ';', '\' and newlines escaped inside field values.
function escapeVCardValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const db = createServiceRoleClient();

  const { data: plaque } = await db
    .from("plaques")
    .select("tier, link_type, vcard_data")
    .eq("short_code", code)
    .maybeSingle();

  if (!plaque || plaque.tier !== "avis" || plaque.link_type !== "vcard" || !plaque.vcard_data) {
    return NextResponse.json({ error: "Fiche contact non configurée." }, { status: 404 });
  }

  const { name, phone, address, org } = plaque.vcard_data;
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapeVCardValue(name)}`,
    `N:${escapeVCardValue(name)};;;;`,
  ];
  if (org) lines.push(`ORG:${escapeVCardValue(org)}`);
  if (phone) lines.push(`TEL;TYPE=WORK,VOICE:${escapeVCardValue(phone)}`);
  if (address) lines.push(`ADR;TYPE=WORK:;;${escapeVCardValue(address)};;;;`);
  lines.push("END:VCARD");

  return new NextResponse(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${code}.vcf"`,
    },
  });
}
