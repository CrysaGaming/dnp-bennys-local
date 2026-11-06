import type { NextConfig } from "next";
import pkg from "./package.json";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  // Der Footer zeigt die Version (Spec 5.5) – die kommt aus package.json.
  env: { NEXT_PUBLIC_APP_VERSION: pkg.version },
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
