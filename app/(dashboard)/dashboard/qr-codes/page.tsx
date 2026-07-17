import { requireMerchantContext } from "@/lib/merchant";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { urlQrDataUrl } from "@/lib/qr/generate";
import { appBaseUrl } from "@/lib/env";
import { getMerchantQrCodes, getStaffScanRows } from "@/lib/qrCodesData";
import { StaffQrList } from "@/components/dashboard/StaffQrList";
import { QrCodeManager } from "@/components/dashboard/QrCodeManager";

export default async function QrCodesPage() {
  const merchant = await requireMerchantContext();
  const supabase = await createServerSupabaseClient();

  const [staffRows, customQrRows] = await Promise.all([
    getStaffScanRows(supabase, merchant.merchantId),
    getMerchantQrCodes(supabase, merchant.merchantId),
  ]);

  const joinUrl = `${appBaseUrl()}/join/${merchant.slug}`;
  const db = createServiceRoleClient();

  const [joinQr, staffWithQr, customQrCodes] = await Promise.all([
    urlQrDataUrl(joinUrl),
    Promise.all(
      staffRows.map(async (row) => {
        const { data } = await db.auth.admin.getUserById(row.authUserId);
        return {
          id: row.id,
          role: row.role,
          email: data.user?.email ?? "—",
          qrDataUrl: row.scanToken
            ? await urlQrDataUrl(`${appBaseUrl()}/staff-scan/${row.scanToken}`)
            : null,
        };
      })
    ),
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
          À imprimer et afficher dans votre commerce, ou à distribuer à votre équipe.
        </p>
      </div>

      <section>
        <h2 className="font-semibold text-gray-900">Rejoindre</h2>
        <p className="mt-1 text-sm text-gray-600">
          Vos clients scannent ce QR pour obtenir leur carte de fidélité.
        </p>
        <div className="mt-4 max-w-xs rounded-2xl border border-gray-100 p-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={joinQr} alt="QR code d'inscription" width={200} height={200} className="mx-auto" />
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
        <h2 className="font-semibold text-gray-900">QR par employé</h2>
        <p className="mt-1 text-sm text-gray-600">
          Chaque membre de l&apos;équipe scanne son propre QR pour ouvrir le scanner sur un
          appareil partagé en caisse, sans se reconnecter.
        </p>
        <div className="mt-4">
          <StaffQrList staff={staffWithQr} canManage={merchant.role === "owner"} />
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
