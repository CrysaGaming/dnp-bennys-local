#!/usr/bin/env node
/**
 * Liest die Logo-Entwürfe aus `docs/brand/logo-entwuerfe/` und schreibt
 * `src/components/brand/logo-data.ts` (AGENTS.md: generiert, nicht von Hand ändern).
 *
 * Normalisiert wird nur das `<svg>`-Tag: `width`/`height` fallen weg (die Größe kommt
 * aus CSS) und `role`/`aria-label` plus `<title>` ebenfalls (den Zugriffsnamen setzt die
 * BrandLogo-Komponente). Alles andere bleibt unangetastet.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const SRC_DIR = "docs/brand/logo-entwuerfe";
const OUT_FILE = "src/components/brand/logo-data.ts";
const ICON_FILE = "src/app/icon.svg";
const EMBLEM_FILE = "logo-v3-emblem.svg";

const FILES = {
  LOS_SANTOS: {
    full: { dark: "logo-v1-los-santos-dark.svg", light: "logo-v1-los-santos-light.svg" },
    compact: { dark: "logo-v1-los-santos-kompakt-dark.svg", light: "logo-v1-los-santos-kompakt-light.svg" },
  },
  VICE_CITY: {
    full: { dark: "logo-v2-vice-city-dark.svg", light: "logo-v2-vice-city-light.svg" },
    compact: { dark: "logo-v2-vice-city-kompakt-dark.svg", light: "logo-v2-vice-city-kompakt-light.svg" },
  },
};

function normalize(raw, file) {
  const open = raw.match(/<svg([^>]*)>/);
  if (!open) throw new Error(`Kein <svg>-Tag in ${file}`);

  const attrs = open[1].replace(/\s(?:width|height|role|aria-label)="[^"]*"/g, "");
  const rest = raw
    .slice(open.index + open[0].length)
    .replace(/<title>[\s\S]*?<\/title>/g, "")
    .trim();

  return `<svg${attrs}>${rest}`;
}

function read(file) {
  return normalize(readFileSync(`${SRC_DIR}/${file}`, "utf8"), file);
}

const data = Object.fromEntries(
  Object.entries(FILES).map(([variant, layouts]) => [
    variant,
    Object.fromEntries(
      Object.entries(layouts).map(([layout, themes]) => [
        layout,
        { dark: read(themes.dark), light: read(themes.light) },
      ]),
    ),
  ]),
);

const header = `// generiert – nicht von Hand ändern: node scripts/extract-logos.mjs
// Quelle: docs/brand/logo-entwuerfe/ (Spec 5.11)

export type LogoLayout = "full" | "compact";
export type LogoTheme = "dark" | "light";

export const LOGO_DATA = ${JSON.stringify(data, null, 2)} satisfies Record<
  "LOS_SANTOS" | "VICE_CITY",
  Record<LogoLayout, Record<LogoTheme, string>>
>;

export const EMBLEM_SVG = ${JSON.stringify(read(EMBLEM_FILE))};
`;

mkdirSync("src/components/brand", { recursive: true });
mkdirSync("src/app", { recursive: true });

writeFileSync(OUT_FILE, header);
// Favicon bleibt immer V3 – unveränderte Kopie des Entwurfs (Spec 5.11).
writeFileSync(ICON_FILE, readFileSync(`${SRC_DIR}/${EMBLEM_FILE}`, "utf8"));

console.log(`✓ ${OUT_FILE} und ${ICON_FILE} geschrieben`);
