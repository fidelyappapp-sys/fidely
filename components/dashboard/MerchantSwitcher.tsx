"use client";

import { switchActiveMerchant } from "@/lib/actions/merchantSwitch";

export function MerchantSwitcher({
  merchants,
  activeMerchantId,
}: {
  merchants: { merchantId: string; businessName: string }[];
  activeMerchantId: string;
}) {
  return (
    <form action={switchActiveMerchant}>
      <select
        name="merchantId"
        defaultValue={activeMerchantId}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm text-gray-700"
      >
        {merchants.map((m) => (
          <option key={m.merchantId} value={m.merchantId}>
            {m.businessName}
          </option>
        ))}
      </select>
    </form>
  );
}
