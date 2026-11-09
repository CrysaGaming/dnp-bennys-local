import type { NextConfig } from "next";
import pkg from "./package.json";

// React braucht im Entwicklungsmodus `eval` für HMR und Fehlerstacks – ohne den Hinweis
// bleibt die Seite schwarz. Production-CSP bleibt unverändert streng (Spec 8).
const DEV_SCRIPT_SRC_EXTRA = process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'";

const CSP = [
  "default-src 'self'",
  "img-src 'self' data: blob:",
  "media-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  `script-src 'self' 'unsafe-inline'${DEV_SCRIPT_SRC_EXTRA}`,
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  // Der Footer zeigt die Version (Spec 5.5) – die kommt aus package.json.
  env: { NEXT_PUBLIC_APP_VERSION: pkg.version },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "Content-Security-Policy", value: CSP },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    },
  ],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
