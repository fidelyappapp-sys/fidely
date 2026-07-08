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
});

export const scanSchema = z.object({
  payload: z.string().trim().min(3),
});
