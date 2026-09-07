import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
