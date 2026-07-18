import Link from "next/link";
import { requireMerchantContext } from "@/lib/merchant";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { urlQrDataUrl } from "@/lib/qr/generate";
import { appBaseUrl } from "@/lib/env";
import { getMerchantQrCodes } from "@/lib/qrCodesData";
import { QrCodeManager } from "@/components/dashboard/QrCodeManager";

export default async function QrCodesPage() {
  const merchant = await requireMerchantContext();
  const supabase = await createServerSupabaseClient();

  const customQrRows = await getMerchantQrCodes(supabase, merchant.merchantId);
  const joinUrl = `${appBaseUrl()}/join/${merchant.slug}`;

  const [joinQr, customQrCodes] = await Promise.all([
    urlQrDataUrl(joinUrl),
    Promise.all(
      customQrRows.map(async (row) => ({
        ...row,
        qrDataUrl: await urlQrDataUrl(row.targetUrl),
      }))
    ),
  ]);

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-2xl font-semibold">QR codes</h1>
        <p className="mt-1 text-sm text-gray-600">
          À imprimer et afficher dans votre commerce. Le QR de chaque employé pour le scanner se
          trouve dans{" "}
          <Link href="/dashboard/staff" className="font-medium text-indigo-600 hover:text-indigo-500">
            Équipe
          </Link>
          .
        </p>
      </div>

      <section>
        <h2 className="font-semibold text-gray-900">Rejoindre — pour vos clients</h2>
        <p className="mt-1 text-sm text-gray-600">
          Vos clients scannent ce QR pour obtenir leur carte de fidélité.
        </p>
        <div className="mt-4 max-w-xs rounded-2xl border border-gray-100 p-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={joinQr} alt="QR code d'inscription" width={220} height={220} className="mx-auto" />
          <a
            href={joinQr}
            download="fidely-qr-rejoindre.png"
            className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Télécharger
          </a>
        </div>
      </section>

      <section>
        <h2 className="font-semibold text-gray-900">QR codes personnalisés</h2>
        <p className="mt-1 text-sm text-gray-600">
          Offres spéciales, autre point de vente... créez un QR vers n&apos;importe quel lien.
        </p>
        <div className="mt-4">
          <QrCodeManager items={customQrCodes} />
        </div>
      </section>
    </div>
  );
}
