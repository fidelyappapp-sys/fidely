import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Next's output-file-tracing misses sharp's native linux-x64 binary
  // (@img/sharp-linux-x64 / @img/sharp-libvips-linux-x64) for the routes
  // that only reach lib/wallet/apple/assets.ts through a dynamic import —
  // it deploys without dlopen'able libvips, so every PassKit pass build
  // 500s in production despite passing locally. Forcing inclusion here is
  // Next's documented escape hatch for exactly this tracing gap.
  outputFileTracingIncludes: {
    "/api/wallet/apple/**": [
      "./node_modules/@img/sharp-linux-x64/**/*",
      "./node_modules/@img/sharp-libvips-linux-x64/**/*",
    ],
  },
  async rewrites() {
    return [
      // The 100 pre-printed batch cards (QR/NFC already manufactured) encode
      // /j/{code} — rewritten (not redirected, so the URL bar keeps /j/...)
      // to the same plaque page as the self-service /p/{code} flow.
      { source: "/j/:code", destination: "/p/:code" },
    ];
  },
  async headers() {
    return [
      {
        // The edit token lives in the URL (see app/avis/edit/[token]) —
        // no-referrer keeps it out of any outgoing Referer header on that page.
        source: "/avis/edit/:token*",
        headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
      },
    ];
  },
};

export default nextConfig;
