import { notFound } from "next/navigation";
import Link from "next/link";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getMerchantQrCodes } from "@/lib/qrCodesData";
import { urlQrDataUrl } from "@/lib/qr/generate";
import { appBaseUrl } from "@/lib/env";
import { QrPrintView } from "@/components/admin/QrPrintView";

export default async function AdminMerchantQrPrintPage({
  params,
}: {
  params: Promise<{ merchantId: string }>;
}) {
  const { merchantId } = await params;
  const db = createServiceRoleClient();

  const { data: merchant } = await db
    .from("merchants")
    .select("id, business_name, slug")
    .eq("id", merchantId)
    .maybeSingle();

  if (!merchant) notFound();

  // "main" is the same point of sale already rendered as "Inscription"
  // below (a real row since 0023, previously only a virtual URL) — exclude
  // it here to avoid printing it twice.
  const customQrRows = (await getMerchantQrCodes(db, merchant.id)).filter((row) => row.kind !== "main");
  const joinUrl = `${appBaseUrl()}/join/${merchant.slug}`;

  const items = await Promise.all([
    { label: "Inscription", qrDataUrl: await urlQrDataUrl(joinUrl) },
    ...customQrRows.map(async (row) => ({ label: row.label, qrDataUrl: await urlQrDataUrl(row.targetUrl) })),
  ]);

  return (
    <div>
      <Link
        href={`/admin/merchants/${merchant.id}`}
        className="no-print text-sm text-gray-500 hover:text-gray-900"
      >
        ← {merchant.business_name}
      </Link>
      <h1 className="no-print mt-2 mb-6 text-2xl font-semibold">QR codes — {merchant.business_name}</h1>

      <QrPrintView businessName={merchant.business_name} items={items} />
    </div>
  );
}
