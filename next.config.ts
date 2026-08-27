import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for the long-lived Docker/VM path (`IS_DOCKER=true` / `npm run build:docker`)
  ...(process.env.IS_DOCKER === "true" ? { output: "standalone" } : {}),
  // @napi-rs/canvas ships native binaries that must not be bundled by webpack
  // (used by the PDF/PPTX parsers for rasterising image-heavy slides).
  serverExternalPackages: ["@napi-rs/canvas"],
  env: {
    NEXT_PUBLIC_GIT_COMMIT_SHA: process.env.GIT_COMMIT_SHA || "dev",
  },

  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
  },

  headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://image.pollinations.ai; font-src 'self'; connect-src 'self'; frame-ancestors 'none';",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
