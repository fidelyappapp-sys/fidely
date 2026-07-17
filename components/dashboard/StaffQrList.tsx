import { regenerateStaffScanTokenFormAction } from "@/lib/actions/qrCodes";

interface StaffQrItem {
  id: string;
  email: string;
  role: string;
  qrDataUrl: string | null;
}

export function StaffQrList({ staff, canManage }: { staff: StaffQrItem[]; canManage: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {staff.map((member) => (
        <div key={member.id} className="rounded-2xl border border-gray-100 p-5 text-center">
          {member.qrDataUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={member.qrDataUrl}
                alt={`QR scanner de ${member.email}`}
                width={160}
                height={160}
                className="mx-auto"
              />
              <p className="mt-3 truncate font-medium text-gray-900">{member.email}</p>
              <p className="text-xs text-gray-500 capitalize">{member.role}</p>
              <div className="mt-3 flex items-center justify-center gap-4">
                <a
                  href={member.qrDataUrl}
                  download={`fidely-qr-${member.email}.png`}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Télécharger
                </a>
                {canManage && (
                  <form action={regenerateStaffScanTokenFormAction.bind(null, member.id)}>
                    <button type="submit" className="text-xs font-medium text-gray-500 hover:text-gray-700">
                      Régénérer
                    </button>
                  </form>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="truncate font-medium text-gray-900">{member.email}</p>
              <p className="mt-2 text-xs text-gray-400">
                Lien personnel non disponible pour le moment.
              </p>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
