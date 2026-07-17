function AppleGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 384 512" className={className} fill="currentColor" aria-hidden>
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141 0 189.1 0 287.4c0 29 5.3 59 15.9 90 14.1 40.7 65.1 140.5 118.4 138.8 27.8-.7 47.5-19.8 83.6-19.8 35.1 0 53.3 19.8 84.4 19.8 53.8-.8 100-91.7 113.4-132.5-72.2-34-97-100.4-97-115zM255.7 88.7c30.1-35.8 27.4-68.4 26.5-80.1-26.6 1.5-57.4 18.1-75 38.6-19.4 21.9-30.8 49.1-28.3 79.3 28.5 2.2 54.5-12.2 76.8-37.8z" />
    </svg>
  );
}

function GoogleWalletButton({ publicId }: { publicId: string }) {
  return (
    <a
      href={`/api/wallet/google/save-link?publicId=${publicId}`}
      className="mx-auto block w-fit transition hover:-translate-y-0.5 hover:opacity-90"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/wallet/google-wallet-fr.svg"
        alt="Ajouter à Google Wallet"
        width={199}
        height={55}
        className="h-14 w-auto"
      />
    </a>
  );
}

function AppleWalletButton({
  configured,
  passSerialNumber,
}: {
  configured: boolean;
  passSerialNumber: string;
}) {
  const badge = (
    <span className="flex h-14 w-[199px] items-center justify-center gap-2 rounded-xl bg-black px-4 text-white ring-1 ring-white/10">
      <AppleGlyph className="h-6 w-6 shrink-0" />
      <span className="text-left leading-tight">
        <span className="block text-[10px] font-light">Ajouter à</span>
        <span className="block -mt-0.5 text-lg font-semibold tracking-tight">Wallet</span>
      </span>
    </span>
  );

  if (configured) {
    return (
      <a
        href={`/api/wallet/apple/pass/${passSerialNumber}`}
        className="mx-auto block w-fit transition hover:-translate-y-0.5 hover:opacity-90"
      >
        {badge}
      </a>
    );
  }

  return (
    <div className="relative mx-auto w-fit" title="Bientôt disponible sur iOS">
      <div className="pointer-events-none opacity-40 grayscale">{badge}</div>
      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-gray-900 px-2.5 py-1 text-[10px] font-medium whitespace-nowrap text-white shadow-sm">
        Bientôt disponible · iOS
      </span>
    </div>
  );
}

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
  return (
    <div className="mt-6 flex flex-col items-center gap-4">
      {googleConfigured && <GoogleWalletButton publicId={publicId} />}
      <AppleWalletButton configured={appleConfigured} passSerialNumber={passSerialNumber} />
    </div>
  );
}
