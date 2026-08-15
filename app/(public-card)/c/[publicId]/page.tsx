import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { qrCodeDataUrl } from "@/lib/qr/generate";
import { isAppleWalletConfigured, isGoogleWalletConfigured, isWebPushConfigured } from "@/lib/env";
import { suggestTextColor } from "@/lib/color";
import {
  resolveCardDesign,
  POINT_OF_SALE_DESIGN_FIELDS,
  MERCHANT_DESIGN_FIELDS,
  type PointOfSaleDesignRow,
  type MerchantDesignRow,
} from "@/lib/wallet/design";
import { CardPoints } from "@/components/public-card/CardPoints";
import { WalletButtons } from "@/components/public-card/WalletButtons";
import { PushOptIn } from "@/components/public-card/PushOptIn";
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

  // Same design resolution as the real Apple/Google Wallet pass (see
  // lib/wallet/design.ts) — this page is what a customer sees right before
  // adding the card, it must never show a different look than what they're
  // about to get. Only columns guaranteed to exist since 0001_init.sql plus
  // the design/point-of-sale ones (0016/0021/0024, all already applied
  // everywhere this runs) — subscription_status is fetched separately below
  // so a missing column there still can't take the whole page down.
  const { data: card } = await db
    .from("loyalty_cards")
    .select(
      `points, merchant_id, merchant_qr_code_id, pass_serial_number, created_at, merchants(${MERCHANT_DESIGN_FIELDS}), loyalty_programs(display_mode, stamp_count, reward_threshold, reward_description), merchant_qr_codes(city, ${POINT_OF_SALE_DESIGN_FIELDS})`
    )
    .eq("public_id", publicId)
    .maybeSingle();

  if (!card) notFound();

  const merchant = card.merchants as unknown as MerchantDesignRow | null;
  const pointOfSale = card.merchant_qr_codes as unknown as
    | (PointOfSaleDesignRow & { city: string | null })
    | null;
  const program = card.loyalty_programs as unknown as {
    display_mode: "stamps" | "points";
    stamp_count: number;
    reward_threshold: number;
    reward_description: string;
  } | null;

  const [qrDataUrl, extras, menuItems, galleryPhotos, subscriptionRow] = await Promise.all([
    qrCodeDataUrl(publicId),
    getMerchantPageExtras(db, card.merchant_id),
    getMerchantMenuItems(db, card.merchant_id),
    getMerchantGalleryPhotos(db, card.merchant_id),
    db.from("merchants").select("subscription_status").eq("id", card.merchant_id).maybeSingle(),
  ]);

  const isPaused = subscriptionRow.data?.subscription_status === "paused";
  const design = merchant ? resolveCardDesign(pointOfSale, merchant) : null;
  const useBackgroundPhoto = Boolean(design?.backgroundPhotoEnabled && design?.backgroundPhotoUrl);
  const showLogoAsName = design?.nameDisplayMode === "logo" && Boolean(design?.logoUrl);

  const brandColor = design?.brandColor ?? "#111827";
  const textColor = design?.textColor ?? suggestTextColor(brandColor);
  const memberSince = new Date(card.created_at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="min-h-full bg-gray-50 pb-16">
      <div className="mx-auto max-w-md px-6 pt-10">
        {isPaused ? (
          <div className="rounded-3xl bg-white p-6 text-center shadow-xl shadow-black/10">
            <p className="text-lg font-semibold text-gray-900">Commerce temporairement fermé</p>
            <p className="mt-2 text-sm text-gray-500">
              Ce commerce ne peut pas enregistrer de nouveaux points pour le moment. Revenez bientôt !
            </p>
          </div>
        ) : (
          <>
            {/* Mirrors the real Apple/Google Wallet pass layout (see
                lib/wallet/apple/pkpass.ts): logo + city on top
                (headerFields), reward + solde/objectif in the middle
                (primary/secondary/auxiliary fields), QR code underneath.
                Phone/customer name aren't shown here on purpose — on the
                real pass they only ever appear on the back (Apple, via the
                ⓘ icon) or not at all (Google). */}
            <div
              className="relative overflow-hidden rounded-[28px] shadow-xl shadow-black/10"
              style={{ backgroundColor: brandColor, color: textColor }}
            >
              {useBackgroundPhoto ? (
                <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-40 overflow-hidden">
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url(${design?.backgroundPhotoUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                  <div
                    className="absolute inset-x-0 bottom-0 h-12"
                    style={{ background: `linear-gradient(to bottom, transparent, ${brandColor})` }}
                  />
                </div>
              ) : (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_-10%,_rgba(255,255,255,0.18),_transparent_55%)]"
                />
              )}

              <div className="relative p-6">
                <div className="flex items-center justify-between">
                  {design?.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={design.logoUrl}
                      alt={merchant?.business_name}
                      className="h-12 w-12 rounded-xl object-cover shadow-lg ring-2 ring-white/30"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 text-lg font-bold text-white shadow-lg ring-2 ring-white/30">
                      {merchant?.business_name?.[0]?.toUpperCase() ?? "F"}
                    </div>
                  )}
                  {pointOfSale?.city && (
                    <span className="font-serif text-xs tracking-wide opacity-70">{pointOfSale.city}</span>
                  )}
                </div>

                <div className="mt-6 text-center">
                  {showLogoAsName ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={design!.logoUrl!}
                      alt={merchant?.business_name}
                      className="mx-auto h-14 max-w-[70%] object-contain"
                    />
                  ) : (
                    <h1 className="font-serif text-2xl font-semibold tracking-tight">
                      {merchant?.business_name}
                    </h1>
                  )}
                  {extras.openingHours.length > 0 && (
                    <div className="mt-3 flex justify-center">
                      <OpenBadge hours={extras.openingHours} />
                    </div>
                  )}

                  <div className="mt-6">
                    <CardPoints
                      publicId={publicId}
                      initial={{
                        points: card.points,
                        displayMode: program?.display_mode ?? "stamps",
                        stampCount: program?.stamp_count ?? 10,
                        rewardThreshold: program?.reward_threshold ?? 0,
                        rewardDescription: program?.reward_description ?? "",
                      }}
                    />
                  </div>
                  <p className="mt-4 text-[10px] tracking-wide opacity-60">Membre depuis {memberSince}</p>
                </div>

                <div className="mx-auto mt-5 flex w-fit items-center justify-center rounded-2xl bg-white p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl} alt="QR code de fidélité" width={180} height={180} />
                </div>
                <p className="mt-3 text-center text-xs opacity-80">
                  Présentez ce QR code en caisse pour cumuler des points.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <WalletButtons
                publicId={publicId}
                passSerialNumber={card.pass_serial_number}
                appleConfigured={isAppleWalletConfigured}
                googleConfigured={isGoogleWalletConfigured}
              />
            </div>

            {isWebPushConfigured && (
              <PushOptIn publicId={publicId} vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!} />
            )}
          </>
        )}

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
