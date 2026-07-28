import sharp from "sharp";

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const match = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!match) return { r: 17, g: 24, b: 39 };
  return {
    r: parseInt(match[1], 16),
    g: parseInt(match[2], 16),
    b: parseInt(match[3], 16),
  };
}

export function hexToPassRgbString(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${r}, ${g}, ${b})`;
}

// Solid-color placeholder, used as the icon (always — Apple requires a
// square icon, unrelated to the merchant's uploaded artwork) and as a
// logo fallback for merchants who haven't uploaded one yet.
async function solidPng(width: number, height: number, hex: string): Promise<Buffer> {
  const { r, g, b } = hexToRgb(hex);
  return sharp({
    create: { width, height, channels: 4, background: { r, g, b, alpha: 1 } },
  })
    .png()
    .toBuffer();
}

// Downloads the merchant's uploaded logo once, ahead of resizing it to the
// three sizes Wallet needs. Returns null (falling back to the solid-color
// placeholder) if the merchant hasn't uploaded one or the fetch fails —
// a broken image link shouldn't block pass generation.
async function fetchLogoSource(sourceUrl: string): Promise<Buffer | null> {
  try {
    const res = await fetch(sourceUrl);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

function fitLogoPng(source: Buffer, width: number, height: number, hex: string): Promise<Buffer> {
  const { r, g, b } = hexToRgb(hex);
  return sharp(source)
    .resize(width, height, { fit: "contain", background: { r, g, b, alpha: 1 } })
    .png()
    .toBuffer();
}

export async function generatePassAssets(brandColorHex: string, logoUrl?: string | null) {
  const logoSource = logoUrl ? await fetchLogoSource(logoUrl) : null;
  const logo = (width: number, height: number) =>
    logoSource ? fitLogoPng(logoSource, width, height, brandColorHex) : solidPng(width, height, brandColorHex);

  const [icon, icon2x, icon3x, logo1x, logo2x, logo3x] = await Promise.all([
    solidPng(29, 29, brandColorHex),
    solidPng(58, 58, brandColorHex),
    solidPng(87, 87, brandColorHex),
    logo(160, 50),
    logo(320, 100),
    logo(480, 150),
  ]);

  return {
    "icon.png": icon,
    "icon@2x.png": icon2x,
    "icon@3x.png": icon3x,
    "logo.png": logo1x,
    "logo@2x.png": logo2x,
    "logo@3x.png": logo3x,
  };
}
