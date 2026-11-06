import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  // Von shadcn generierte Dateien (AGENTS.md: nicht von Hand umbauen) –
  // dort darf das Initialisieren im Effect bleiben.
  {
    files: ["src/components/ui/**", "src/hooks/**"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Build-artefakte (Seed-Bundle, Playwright-Zwischenablage):
    "dist/**",
    "tmp/**",
  ]),
]);

export default eslintConfig;
