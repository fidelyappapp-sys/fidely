export function WalletButtons({
  publicId,
  passSerialNumber,
  appleConfigured,
  googleConfigured,
}: {
  publicId: string;
  passSerialNumber: string;
  appleConfigured: boolean;
  googleConfigured: boolean;
}) {
  if (!appleConfigured && !googleConfigured) return null;

  return (
    <div className="mt-6 flex flex-col gap-3">
      {appleConfigured && (
        <a
          href={`/api/wallet/apple/pass/${passSerialNumber}`}
          className="flex items-center justify-center rounded-lg bg-black px-4 py-3 text-sm font-medium text-white"
        >
          Ajouter à Apple Wallet
        </a>
      )}
      {googleConfigured && (
        <a
          href={`/api/wallet/google/save-link?publicId=${publicId}`}
          className="flex items-center justify-center rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-900"
        >
          Ajouter à Google Wallet
        </a>
      )}
    </div>
  );
}
