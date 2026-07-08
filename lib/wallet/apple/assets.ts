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

// Generates a solid-color placeholder icon/logo tinted with the merchant's
// brand color, so passes look reasonable without requiring merchants to
// upload real artwork. A future iteration can swap this for their
// uploaded logo (merchants.logo_url).
async function solidPng(width: number, height: number, hex: string): Promise<Buffer> {
  const { r, g, b } = hexToRgb(hex);
  return sharp({
    create: { width, height, channels: 4, background: { r, g, b, alpha: 1 } },
  })
    .png()
    .toBuffer();
}

export async function generatePassAssets(brandColorHex: string) {
  const [icon, icon2x, icon3x, logo, logo2x, logo3x] = await Promise.all([
    solidPng(29, 29, brandColorHex),
    solidPng(58, 58, brandColorHex),
    solidPng(87, 87, brandColorHex),
    solidPng(160, 50, brandColorHex),
    solidPng(320, 100, brandColorHex),
    solidPng(480, 150, brandColorHex),
  ]);

  return {
    "icon.png": icon,
    "icon@2x.png": icon2x,
    "icon@3x.png": icon3x,
    "logo.png": logo,
    "logo@2x.png": logo2x,
    "logo@3x.png": logo3x,
  };
}
