"use client";

import { deactivateEmployee } from "@/lib/actions/staff";

export interface EmployeeItem {
  id: string;
  name: string;
  isOwner: boolean;
  active: boolean;
  qrDataUrl: string | null;
}

export function EmployeeList({
  employees,
  canManage,
}: {
  employees: EmployeeItem[];
  canManage: boolean;
}) {
  const active = employees.filter((e) => e.active);
  const inactive = employees.filter((e) => !e.active);

  return (
    <div className="space-y-10">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">Actifs</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((member) => (
            <div key={member.id} className="rounded-2xl border border-gray-100 p-5 text-center">
              {member.qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={member.qrDataUrl}
                  alt={`QR scanner de ${member.name}`}
                  width={160}
                  height={160}
                  className="mx-auto"
                />
              ) : (
                <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-lg bg-gray-50 text-xs text-gray-400">
                  Pas de QR (propriétaire)
                </div>
              )}
              <p className="mt-3 truncate font-medium text-gray-900">{member.name}</p>
              <div className="mt-3 flex items-center justify-center gap-4">
                {member.qrDataUrl && (
                  <a
                    href={member.qrDataUrl}
                    download={`fidely-qr-${member.name.toLowerCase().replace(/\s+/g, "-")}.png`}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Télécharger
                  </a>
                )}
                {canManage && !member.isOwner && (
                  <form action={deactivateEmployee.bind(null, member.id)}>
                    <button type="submit" className="text-xs font-medium text-red-600 hover:text-red-700">
                      Supprimer
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {inactive.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500">Inactifs</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {inactive.map((member) => (
              <span
                key={member.id}
                className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-500"
              >
                {member.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
