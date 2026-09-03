import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pinned so Turbopack doesn't walk up past the repo and pick a stray lockfile
  // out of the home directory.
  turbopack: { root: dirname(fileURLToPath(import.meta.url)) },

  // Listings point at icons and screenshots hosted wherever the publisher keeps
  // them, so those render through plain <img>. This allowlist only covers the
  // few first-party hosts we optimise through next/image.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "raw.githubusercontent.com" },
      { protocol: "https", hostname: "user-images.githubusercontent.com" },
      { protocol: "https", hostname: "github.com" },
    ],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
