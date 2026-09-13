import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
