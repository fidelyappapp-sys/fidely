import { existsSync } from "node:fs";
import { join } from "node:path";

export const HERO_IMAGE_PATH = "/hero-presentoir.jpg";

// The real hero photo (a Fidély display stand on a bar counter) is dropped
// into public/ manually rather than committed as a placeholder asset. Until
// it lands, the hero renders a crafted CSS placeholder instead of a broken
// <img>.
export function heroImageExists(): boolean {
  return existsSync(join(process.cwd(), "public", "hero-presentoir.jpg"));
}
