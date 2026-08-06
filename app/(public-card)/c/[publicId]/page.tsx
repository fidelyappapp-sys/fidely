import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { qrCodeDataUrl } from "@/lib/qr/generate";
import { isAppleWalletConfigured, isGoogleWalletConfigured, isWebPushConfigured } from "@/lib/env";
import type { StampIconKey } from "@/lib/supabase/types";
import { suggestTextColor } from "@/lib/color";
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

  // Only columns guaranteed to exist since 0001_init.sql — the customer
  // card must keep resolving regardless of whether later migrations
  // (stamp_style, background photo, ...) have landed on this database yet.
  const { data: card } = await db
    .from("loyalty_cards")
    .select(
      "points, merchant_id, pass_serial_number, created_at, customers(full_name, phone), merchants(business_name, brand_color, logo_url, subscription_status), loyalty_programs(display_mode, stamp_count, reward_threshold, reward_description)"
    )
    .eq("public_id", publicId)
    .maybeSingle();

  if (!card) notFound();

  const merchant = card.merchants as unknown as {
    business_name: string;
    brand_color: string;
    logo_url: string | null;
    subscription_status: string;
  } | null;
  const customer = card.customers as unknown as { full_name: string | null; phone: string | null } | null;
  const isPaused = merchant?.subscription_status === "paused";
  const program = card.loyalty_programs as unknown as {
    display_mode: "stamps" | "points";
    stamp_count: number;
    reward_threshold: number;
    reward_description: string;
  } | null;

  const [qrDataUrl, extras, menuItems, galleryPhotos, customizationRow] = await Promise.all([
    qrCodeDataUrl(publicId),
    getMerchantPageExtras(db, card.merchant_id),
    getMerchantMenuItems(db, card.merchant_id),
    getMerchantGalleryPhotos(db, card.merchant_id),
    db
      .from("merchants")
      .select("stamp_style, text_color, background_photo_url, background_photo_enabled, name_display_mode")
      .eq("id", card.merchant_id)
      .maybeSingle(),
  ]);

  const stampStyle: StampIconKey =
    (customizationRow.data?.stamp_style as StampIconKey | undefined) ?? "circle";
  const useBackgroundPhoto = Boolean(
    customizationRow.data?.background_photo_enabled && customizationRow.data?.background_photo_url
  );
  const showLogoAsName = customizationRow.data?.name_display_mode === "logo" && Boolean(merchant?.logo_url);

  const brandColor = merchant?.brand_color ?? "#111827";
  const textColor = customizationRow.data?.text_color ?? suggestTextColor(brandColor);
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
            {/* The membership card: logo + join date on top, name/points in the
                middle over the photo or solid brand color, phone/customer name
                at the bottom, QR code centered underneath. */}
            <div
              className="relative overflow-hidden rounded-[28px] shadow-xl shadow-black/10"
              style={{ backgroundColor: brandColor, color: textColor }}
            >
              {useBackgroundPhoto ? (
                <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-40 overflow-hidden">
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url(${customizationRow.data!.background_photo_url})`,
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
                  {merchant?.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={merchant.logo_url}
                      alt={merchant.business_name}
                      className="h-12 w-12 rounded-xl object-cover shadow-lg ring-2 ring-white/30"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 text-lg font-bold text-white shadow-lg ring-2 ring-white/30">
                      {merchant?.business_name?.[0]?.toUpperCase() ?? "F"}
                    </div>
                  )}
                  <span className="font-serif text-xs tracking-wide opacity-70">
                    Membre depuis {memberSince}
                  </span>
                </div>

                <div className="mt-6 text-center">
                  {showLogoAsName ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={merchant!.logo_url!}
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
                      stampStyle={stampStyle}
                      initial={{
                        points: card.points,
                        displayMode: program?.display_mode ?? "stamps",
                        stampCount: program?.stamp_count ?? 10,
                        rewardThreshold: program?.reward_threshold ?? 0,
                        rewardDescription: program?.reward_description ?? "",
                      }}
                    />
                  </div>
                </div>

                <div className="mt-8 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] tracking-wide uppercase opacity-60">Téléphone</p>
                    <p className="text-sm font-medium">{customer?.phone || "—"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] tracking-wide uppercase opacity-60">Client</p>
                    <p className="font-serif text-sm font-medium">{customer?.full_name || "—"}</p>
                  </div>
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
