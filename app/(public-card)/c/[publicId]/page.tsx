import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { qrCodeDataUrl } from "@/lib/qr/generate";
import { isAppleWalletConfigured, isGoogleWalletConfigured } from "@/lib/env";
import { CardPoints } from "@/components/public-card/CardPoints";
import { WalletButtons } from "@/components/public-card/WalletButtons";
import { OpenBadge } from "@/components/public-card/OpenBadge";
import { OpeningHoursList } from "@/components/public-card/OpeningHoursList";
import { MenuSection } from "@/components/public-card/MenuSection";
import { GallerySection } from "@/components/public-card/GallerySection";
import { ActionButtons } from "@/components/public-card/ActionButtons";
import { Reveal } from "@/components/marketing/Reveal";
import {
  getMerchantGalleryPhotos,
  getMerchantMenuItems,
  getMerchantPageExtras,
} from "@/lib/merchantPageContent";

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
      "points, merchant_id, pass_serial_number, merchants(business_name, brand_color, logo_url), loyalty_programs(reward_threshold, reward_description)"
    )
    .eq("public_id", publicId)
    .maybeSingle();

  if (!card) notFound();

  const merchant = card.merchants as unknown as {
    business_name: string;
    brand_color: string;
    logo_url: string | null;
  } | null;
  const program = card.loyalty_programs as unknown as {
    reward_threshold: number;
    reward_description: string;
  } | null;

  const [qrDataUrl, extras, menuItems, galleryPhotos] = await Promise.all([
    qrCodeDataUrl(publicId),
    getMerchantPageExtras(db, card.merchant_id),
    getMerchantMenuItems(db, card.merchant_id),
    getMerchantGalleryPhotos(db, card.merchant_id),
  ]);

  const brandColor = merchant?.brand_color ?? "#111827";

  return (
    <div className="min-h-full bg-gray-50 pb-16">
      {/* Cover / identity */}
      <div
        className="relative overflow-hidden px-6 pt-12 pb-20 text-white"
        style={{ backgroundColor: brandColor }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_-10%,_rgba(255,255,255,0.18),_transparent_55%)]"
        />
        <div
          aria-hidden
          className="animate-drift pointer-events-none absolute -top-24 right-[-6rem] h-72 w-72 rounded-full bg-white/10 blur-3xl"
        />
        <div className="relative mx-auto max-w-md text-center">
          {merchant?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={merchant.logo_url}
              alt={merchant.business_name}
              className="mx-auto h-16 w-16 rounded-2xl object-cover shadow-lg ring-2 ring-white/30"
            />
          ) : (
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-2xl font-bold shadow-lg ring-2 ring-white/30">
              {merchant?.business_name?.[0]?.toUpperCase() ?? "F"}
            </div>
          )}
          <h1 className="mt-4 text-2xl font-bold tracking-tight">{merchant?.business_name}</h1>
          {extras.address && <p className="mt-1 text-sm text-white/70">{extras.address}</p>}
          {extras.openingHours.length > 0 && (
            <div className="mt-3">
              <OpenBadge hours={extras.openingHours} />
            </div>
          )}
        </div>
      </div>

      {/* Points card, floating over the cover */}
      <div className="relative mx-auto -mt-12 w-full max-w-md px-6">
        <div
          className="rounded-3xl p-6 text-center text-white shadow-xl shadow-black/10"
          style={{ backgroundColor: brandColor }}
        >
          <CardPoints
            publicId={publicId}
            initial={{
              points: card.points,
              rewardThreshold: program?.reward_threshold ?? 0,
              rewardDescription: program?.reward_description ?? "",
            }}
          />

          <div className="mx-auto mt-6 flex w-fit items-center justify-center rounded-2xl bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR code de fidélité" width={180} height={180} />
          </div>
          <p className="mt-3 text-xs opacity-80">
            Présentez ce QR code en caisse pour cumuler des points.
          </p>
        </div>

        <div className="mt-4">
          <WalletButtons
            publicId={publicId}
            passSerialNumber={card.pass_serial_number}
            appleConfigured={isAppleWalletConfigured}
            googleConfigured={isGoogleWalletConfigured}
          />
        </div>

        <div className="mt-6">
          <ActionButtons
            phone={extras.phone}
            mapsLink={extras.googleMapsLink}
            reviewLink={extras.googleReviewLink}
          />
        </div>

        {extras.openingHours.length > 0 && (
          <Reveal>
            <section className="mt-10">
              <h2 className="mb-3 text-sm font-semibold tracking-wide text-gray-500 uppercase">
                Horaires
              </h2>
              <OpeningHoursList hours={extras.openingHours} />
            </section>
          </Reveal>
        )}

        {menuItems.length > 0 && (
          <Reveal>
            <section className="mt-10">
              <h2 className="mb-3 text-sm font-semibold tracking-wide text-gray-500 uppercase">
                Menu
              </h2>
              <MenuSection items={menuItems} />
            </section>
          </Reveal>
        )}

        {galleryPhotos.length > 0 && (
          <Reveal>
            <section className="mt-10">
              <h2 className="mb-3 text-sm font-semibold tracking-wide text-gray-500 uppercase">
                Galerie
              </h2>
              <GallerySection photos={galleryPhotos} />
            </section>
          </Reveal>
        )}

        {extras.googleMapsLink && (
          <div className="mt-10 text-center">
            <a
              href={extras.googleMapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-gray-500 underline decoration-gray-300 underline-offset-4 hover:text-gray-700"
            >
              Voir la page Google Maps
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
