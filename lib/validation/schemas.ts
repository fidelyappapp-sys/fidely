import { z } from "zod";

export const onboardingSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Lettres minuscules, chiffres et tirets uniquement"),
  brandColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Couleur hexadécimale invalide")
    .default("#111827"),
  pointsPerScan: z.coerce.number().int().min(1).max(100).default(1),
  rewardThreshold: z.coerce.number().int().min(1).max(1000),
  rewardDescription: z.string().trim().min(2).max(200),
});

export const programUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  pointsPerScan: z.coerce.number().int().min(1).max(100),
  rewardThreshold: z.coerce.number().int().min(1).max(1000),
  rewardDescription: z.string().trim().min(2).max(200),
});

export const joinSchema = z.object({
  merchantSlug: z.string().trim().min(1),
  fullName: z.string().trim().min(1).max(120).optional().or(z.literal("")),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().min(6).max(30).optional().or(z.literal("")),
  birthDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("")),
});

export const scanSchema = z.object({
  payload: z.string().trim().min(3),
});

export const adjustPointsSchema = z.object({
  publicId: z.string().trim().uuid(),
  delta: z.coerce.number().int().min(-1000).max(1000).refine((n) => n !== 0, "Delta requis"),
});

export const broadcastNotificationSchema = z.object({
  title: z.string().trim().min(2).max(80),
  body: z.string().trim().min(2).max(300),
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
  address: z.string().trim().max(300).optional().or(z.literal("")),
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
  photoUrl: z.string().trim().url("Lien invalide").max(500).optional().or(z.literal("")),
});

export const galleryPhotoSchema = z.object({
  url: z.string().trim().url("Lien invalide").max(500),
});

export const qrCodeSchema = z.object({
  label: z.string().trim().min(2).max(80),
  targetUrl: z.string().trim().url("Lien invalide").max(500),
});

const shippingAddressFields = {
  shippingName: z.string().trim().min(2).max(120),
  shippingLine1: z.string().trim().min(2).max(200),
  shippingLine2: z.string().trim().max(200).optional().or(z.literal("")),
  shippingPostalCode: z.string().trim().min(2).max(20),
  shippingCity: z.string().trim().min(2).max(120),
  shippingCountry: z.string().trim().min(2).max(60).default("France"),
};

export const kitDeliverySchema = z.discriminatedUnion("method", [
  z.object({ method: z.literal("hand_delivery") }),
  z.object({ method: z.literal("express_shipping"), ...shippingAddressFields }),
  z.object({ method: z.literal("standard_shipping"), ...shippingAddressFields }),
]);
