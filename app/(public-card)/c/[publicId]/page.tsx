import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { qrCodeDataUrl } from "@/lib/qr/generate";
import { isAppleWalletConfigured, isGoogleWalletConfigured } from "@/lib/env";
import { CardPoints } from "@/components/public-card/CardPoints";
import { WalletButtons } from "@/components/public-card/WalletButtons";

export default async function PublicCardPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const db = createServiceRoleClient();

  const { data: card } = await db
    .from("loyalty_cards")
    .select(
      "points, pass_serial_number, merchants(business_name, brand_color), loyalty_programs(reward_threshold, reward_description)"
    )
    .eq("public_id", publicId)
    .maybeSingle();

  if (!card) notFound();

  const merchant = card.merchants as unknown as {
    business_name: string;
    brand_color: string;
  } | null;
  const program = card.loyalty_programs as unknown as {
    reward_threshold: number;
    reward_description: string;
  } | null;

  const qrDataUrl = await qrCodeDataUrl(publicId);

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div
          className="rounded-3xl p-6 text-center text-white shadow-lg"
          style={{ backgroundColor: merchant?.brand_color ?? "#111827" }}
        >
          <p className="text-sm opacity-80">{merchant?.business_name}</p>

          <div className="my-6 flex justify-center">
            <CardPoints
              publicId={publicId}
              initial={{
                points: card.points,
                rewardThreshold: program?.reward_threshold ?? 0,
                rewardDescription: program?.reward_description ?? "",
              }}
            />
          </div>

          <div className="mx-auto flex w-fit items-center justify-center rounded-2xl bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR code de fidélité" width={200} height={200} />
          </div>
          <p className="mt-3 text-xs opacity-80">
            Présentez ce QR code en caisse pour cumuler des points.
          </p>
        </div>

        <WalletButtons
          publicId={publicId}
          passSerialNumber={card.pass_serial_number}
          appleConfigured={isAppleWalletConfigured}
          googleConfigured={isGoogleWalletConfigured}
        />
      </div>
    </div>
  );
}
