import sharp from "sharp";

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const match = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!match) {
    console.error(`hexToRgb: malformed hex "${hex}", falling back to default color`);
    return { r: 17, g: 24, b: 39 };
  }
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

// Downloads a merchant-uploaded image (logo or background photo) once,
// ahead of resizing it to the sizes Wallet needs. Returns null (falling
// back to the solid-color placeholder, or no strip at all) if nothing was
// uploaded or the fetch fails — a broken image link shouldn't block pass
// generation.
async function fetchImageSource(sourceUrl: string): Promise<Buffer | null> {
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

// Unlike the logo (fit: "contain", letterboxed on brand_color), the strip
// must fill the whole banner — storeCard renders it edge-to-edge behind the
// primary field — so it's center-cropped (fit: "cover") to the fixed 3:1
// ratio PassKit expects instead of padded.
function fitStripPng(source: Buffer, width: number, height: number): Promise<Buffer> {
  return sharp(source).resize(width, height, { fit: "cover", position: "centre" }).png().toBuffer();
}

export async function generatePassAssets(
  brandColorHex: string,
  logoUrl?: string | null,
  stripPhotoUrl?: string | null
) {
  const logoSource = logoUrl ? await fetchImageSource(logoUrl) : null;
  const logo = (width: number, height: number) =>
    logoSource ? fitLogoPng(logoSource, width, height, brandColorHex) : solidPng(width, height, brandColorHex);

  const stripSource = stripPhotoUrl ? await fetchImageSource(stripPhotoUrl) : null;

  const [icon, icon2x, icon3x, logo1x, logo2x, logo3x] = await Promise.all([
    solidPng(29, 29, brandColorHex),
    solidPng(58, 58, brandColorHex),
    solidPng(87, 87, brandColorHex),
    logo(160, 50),
    logo(320, 100),
    logo(480, 150),
  ]);

  const assets: Record<string, Buffer> = {
    "icon.png": icon,
    "icon@2x.png": icon2x,
    "icon@3x.png": icon3x,
    "logo.png": logo1x,
    "logo@2x.png": logo2x,
    "logo@3x.png": logo3x,
  };

  // No strip.png at all when there's no photo (or it failed to download) —
  // an absent strip just means storeCard renders backgroundColor only,
  // which is the existing solid-color look merchants already have.
  if (stripSource) {
    const [strip1x, strip2x, strip3x] = await Promise.all([
      fitStripPng(stripSource, 375, 123),
      fitStripPng(stripSource, 750, 246),
      fitStripPng(stripSource, 1125, 369),
    ]);
    assets["strip.png"] = strip1x;
    assets["strip@2x.png"] = strip2x;
    assets["strip@3x.png"] = strip3x;
  }

  return assets;
}
