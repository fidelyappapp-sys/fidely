import { z } from "zod";

// Step 1 of the onboarding wizard (see app/(onboarding)/onboarding) — just
// enough to create the merchant row. Color, logo, program and reward are
// filled in on later steps, reusing cardCustomizationSchema/programUpdateSchema.
export const onboardingInfosSchema = z.object({
  ownerFirstName: z.string().trim().min(1, "Prénom requis").max(80),
  ownerLastName: z.string().trim().min(1, "Nom requis").max(80),
  ownerPhone: z
    .string()
    .trim()
    .min(6, "Numéro de téléphone invalide")
    .max(20)
    .regex(/^[0-9+\s.-]+$/, "Numéro de téléphone invalide"),
  businessName: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Lettres minuscules, chiffres et tirets uniquement"),
  googleReviewLink: z
    .string()
    .trim()
    .url("Lien invalide")
    .max(500)
    .optional()
    .or(z.literal("")),
});

export const programUpdateSchema = z.discriminatedUnion("displayMode", [
  z.object({
    displayMode: z.literal("stamps"),
    name: z.string().trim().min(2).max(120),
    pointsPerScan: z.coerce.number().int().min(1).max(100),
    stampCount: z.coerce.number().int().min(1).max(20),
    rewardThreshold: z.coerce.number().int().min(1).max(1000),
    rewardDescription: z.string().trim().min(2).max(200),
  }),
  z.object({
    displayMode: z.literal("points"),
    name: z.string().trim().min(2).max(120),
    pointsPerEuro: z.coerce.number().positive().max(1000),
    rewardThreshold: z.coerce.number().int().min(1).max(100_000),
    rewardDescription: z.string().trim().min(2).max(200),
  }),
]);

export const joinSchema = z.object({
  merchantSlug: z.string().trim().min(1),
  fullName: z.string().trim().min(1, "Le nom est requis").max(120),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().min(6).max(30).optional().or(z.literal("")),
  birthDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("")),
  // Id of the merchant_qr_codes row (point of sale) the customer scanned, if
  // any — falls back to the merchant's "main" point of sale when absent. See
  // lib/actions/qrCodes.ts createPointOfSale and app/api/cards/join/route.ts.
  source: z.string().trim().uuid().optional().or(z.literal("")),
});

export const scanSchema = z.object({
  payload: z.string().trim().min(3),
  // Only meaningful in "points" display mode — the purchase amount staff
  // enter so award_scan_points can apply the merchant's €→points ratio.
  amountCents: z.coerce.number().int().min(0).max(10_000_000).optional(),
});

export const adjustPointsSchema = z.object({
  publicId: z.string().trim().uuid(),
  delta: z.coerce.number().int().min(-1000).max(1000).refine((n) => n !== 0, "Delta requis"),
});

export const broadcastNotificationSchema = z.object({
  title: z.string().trim().min(2).max(80),
  body: z.string().trim().min(2).max(300),
  // Absent/empty = every point of sale (explicit "Tous les points de
  // vente" choice) — see components/dashboard/NotificationsForm.tsx.
  posId: z.string().trim().uuid().optional().or(z.literal("")),
});

export const settingsSchema = z.object({
  googleMapsLink: z
    .string()
    .trim()
    .url("Lien invalide")
    .max(500)
    .optional()
    .or(z.literal("")),
  googleReviewLink: z
    .string()
    .trim()
    .url("Lien invalide")
    .max(500)
    .optional()
    .or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
});

const weekDay = z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format HH:MM attendu");

export const openingHoursSchema = z.array(
  z.object({
    day: weekDay,
    closed: z.boolean(),
    open: hhmm,
    close: hhmm,
  })
);

export const menuItemSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  priceCents: z.coerce.number().int().min(0).max(1_000_000).optional(),
});

const sectorValues = [
  "restaurant",
  "food_truck",
  "bar",
  "hairdresser",
  "cafe",
  "bakery",
  "beauty_spa",
  "gym",
  "dry_cleaning",
  "garage",
  "florist",
  "bookstore",
  "pet_shop",
  "pharmacy",
  "cinema",
] as const;

// The stamp icon picker merges the generic shapes with the sector icons
// into one selector (CardCustomizer), so stampStyle accepts either set —
// must stay in sync with the check constraint in
// supabase/migrations/0021_unified_stamp_icon_and_text_color.sql.
export const cardCustomizationSchema = z.object({
  brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Couleur hexadécimale invalide"),
  textColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Couleur hexadécimale invalide"),
  stampStyle: z.enum([
    "star",
    "square",
    "triangle",
    "heart",
    "butterfly",
    "circle",
    "diamond",
    ...sectorValues,
  ]),
  backgroundPhotoEnabled: z.coerce.boolean().optional(),
  nameDisplayMode: z.enum(["text", "logo"]).default("text"),
});

export const employeeSchema = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
});

export const pushSubscribeSchema = z.object({
  publicId: z.string().trim().uuid(),
  subscription: z.object({
    endpoint: z.string().trim().url(),
    keys: z.object({
      p256dh: z.string().trim().min(1),
      auth: z.string().trim().min(1),
    }),
  }),
});

export const qrCodeSchema = z.object({
  label: z.string().trim().min(2).max(80),
  targetUrl: z.string().trim().url("Lien invalide").max(500),
});

// Creating a point of sale: same real join/wallet behavior as the main
// "Rejoindre" QR, but with its own city and its own dedicated loyalty
// program — configuring the program is mandatory at creation time, same as
// the merchant's own onboarding (no "half-configured" point of sale that
// would need a fallback program). Mirrors programUpdateSchema's shape plus
// label/city.
export const createPointOfSaleSchema = z.discriminatedUnion("displayMode", [
  z.object({
    displayMode: z.literal("stamps"),
    label: z.string().trim().min(2).max(80),
    city: z.string().trim().min(2).max(80),
    name: z.string().trim().min(2).max(120),
    pointsPerScan: z.coerce.number().int().min(1).max(100),
    stampCount: z.coerce.number().int().min(1).max(20),
    rewardThreshold: z.coerce.number().int().min(1).max(1000),
    rewardDescription: z.string().trim().min(2).max(200),
  }),
  z.object({
    displayMode: z.literal("points"),
    label: z.string().trim().min(2).max(80),
    city: z.string().trim().min(2).max(80),
    name: z.string().trim().min(2).max(120),
    pointsPerEuro: z.coerce.number().positive().max(1000),
    rewardThreshold: z.coerce.number().int().min(1).max(100_000),
    rewardDescription: z.string().trim().min(2).max(200),
  }),
]);

// Editing just the city of an existing point of sale (main or join_source).
export const updatePointOfSaleCitySchema = z.object({
  id: z.string().trim().uuid(),
  city: z.string().trim().min(2).max(80),
});

export const shippingAddressFields = {
  shippingName: z.string().trim().min(2).max(120),
  shippingLine1: z.string().trim().min(2).max(200),
  shippingLine2: z.string().trim().max(200).optional().or(z.literal("")),
  shippingPostalCode: z.string().trim().min(2).max(20),
  shippingCity: z.string().trim().min(2).max(120),
  shippingCountry: z.string().trim().min(2).max(60).default("France"),
};

export const kitDeliverySchema = z.discriminatedUnion("method", [
  z.object({ method: z.literal("hand_delivery") }),
  z.object({ method: z.literal("postal_shipping"), ...shippingAddressFields }),
]);

export const nfcCardCheckoutSchema = z.discriminatedUnion("deliveryMethod", [
  z.object({
    deliveryMethod: z.literal("hand_delivery"),
    quantity: z.number().int().min(1).max(20),
  }),
  z.object({
    deliveryMethod: z.literal("postal_shipping"),
    quantity: z.number().int().min(1).max(20),
    ...shippingAddressFields,
  }),
]);

// Public, unauthenticated purchase (see app/api/public/nfc-checkout) — always
// shipped (no "hand delivery" concept without an existing merchant
// relationship), and no address fields: Stripe Checkout's own
// shipping_address_collection gathers that instead.
export const publicNfcCheckoutSchema = z.object({
  quantity: z.number().int().min(1).max(20),
});

// Components/pack for the Plaque avis Google (see PLAQUE_COMPONENTS /
// PLAQUE_FULL_KIT in lib/boutique.ts and app/api/boutique/components-checkout).
// qr/nfcChip/fullKit each need one point-of-sale id per unit ordered — the
// *PosIds arrays' length must match their matching quantity, checked below.
export const componentsOrderSchema = z
  .object({
    displayStandQty: z.number().int().min(0).max(20),
    sheetQty: z.number().int().min(0).max(20),
    qrQty: z.number().int().min(0).max(20),
    qrPosIds: z.array(z.string().uuid()),
    nfcChipQty: z.number().int().min(0).max(20),
    nfcChipPosIds: z.array(z.string().uuid()),
    fullKitQty: z.number().int().min(0).max(20),
    fullKitPosIds: z.array(z.string().uuid()),
  })
  .refine((d) => d.qrPosIds.length === d.qrQty, {
    message: "Chaque QR code doit être rattaché à un point de vente.",
    path: ["qrPosIds"],
  })
  .refine((d) => d.nfcChipPosIds.length === d.nfcChipQty, {
    message: "Chaque puce NFC doit être rattachée à un point de vente.",
    path: ["nfcChipPosIds"],
  })
  .refine((d) => d.fullKitPosIds.length === d.fullKitQty, {
    message: "Chaque pack doit être rattaché à un point de vente.",
    path: ["fullKitPosIds"],
  })
  .refine(
    (d) => d.displayStandQty + d.sheetQty + d.qrQty + d.nfcChipQty + d.fullKitQty > 0,
    { message: "Sélectionnez au moins un composant." }
  );

export const addMerchantSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  address: z.string().trim().min(2).max(300),
  businessType: z.string().trim().min(2).max(80),
});
