#!/usr/bin/env node
/**
 * Erzeugt die Login-Hintergründe (Spec 12.2).
 * Originale nach `tmp/login-src/` (gitignored), Ausgabe nach `public/login/`.
 * 1920 × 1080 cover, Helligkeit −15 %, WebP Qualität 75, Ziel ≤ 250 KB.
 * Ist die Datei größer, wird die Qualität in 5er-Schritten gesenkt (Minimum 50).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const MAX_BYTES = 250 * 1024;

const TARGETS = [
  {
    out: "bg-01.webp",
    url: "https://images.unsplash.com/flagged/photo-1575555201693-7cd442b8023f?w=2400&q=90&fm=jpg",
    motiv: "Skyline von Los Angeles mit Palmen im goldenen Abendlicht",
    stil: "GTA V",
    fotograf: "Cedric Letsch",
    page: "https://unsplash.com/photos/los-angeles-skyline-with-palm-trees-UZVlSjrIJ3o",
    Lizenz: "Unsplash-Lizenz",
  },
  {
    out: "bg-02.webp",
    url: "https://images.pexels.com/photos/4488649/pexels-photo-4488649.jpeg?w=2400",
    motiv: "Garage in pinkem und blauem Neon, Oldtimer, leichter Dunst",
    stil: "GTA V",
    fotograf: "cottonbro studio",
    page: "https://www.pexels.com/photo/black-car-in-front-of-store-4488649/",
    Lizenz: "Pexels-Lizenz",
  },
  {
    out: "bg-03.webp",
    url: "https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?w=2400&q=90&fm=jpg",
    motiv: "Straße bei Nacht mit Neon-Hotels („Tropics“), Retro-Miami",
    stil: "GTA VI",
    fotograf: "Ryan Spencer",
    page: "https://unsplash.com/photos/hotel-with-neon-sign-at-night-Um9AkOiIDcU",
    Lizenz: "Unsplash-Lizenz",
  },
  {
    out: "bg-04.webp",
    url: "https://images.unsplash.com/photo-1680567718250-e71cf9bbff15?w=2400&q=90&fm=jpg",
    motiv: "Palmen-Silhouetten vor pink-violettem Sonnenuntergang",
    stil: "GTA VI",
    fotograf: "Brice Cooper",
    page: "https://unsplash.com/photos/a-view-of-a-sunset-with-palm-trees-in-the-foreground-qRQGCraDmXU",
    Lizenz: "Unsplash-Lizenz",
  },
  {
    out: "intro.webp",
    url: "https://images.pexels.com/photos/4488642/pexels-photo-4488642.jpeg?w=2400",
    motiv: "dunkle Garage mit Neon und Auto-Silhouette im Rauch",
    stil: "Intro-Splash",
    fotograf: "cottonbro studio",
    page: "https://www.pexels.com/photo/black-car-parked-beside-store-during-night-time-4488642/",
    Lizenz: "Pexels-Lizenz",
  },
];

async function download(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} für ${url}`);
  const type = res.headers.get("content-type") ?? "";
  if (!type.startsWith("image/")) throw new Error(`kein Bild (${type}) für ${url}`);
  return new Uint8Array(await res.arrayBuffer());
}

function encode(bytes, quality) {
  return sharp(Buffer.from(bytes))
    .resize(1920, 1080, { fit: "cover" })
    .modulate({ brightness: 0.85 })
    .webp({ quality })
    .toBuffer();
}

function credits() {
  const lines = [
    "# Bilder der Login-Seite",
    "",
    "Alle Fotos stehen unter der jeweiligen freien Lizenz der Quelle. Die Liste ist am",
    "2026-11-05 geprüft worden (Spec 12.1 und 12.2). Aufbereitung: 1920 × 1080, Helligkeit",
    "−15 %, WebP. Diese Dateien werden von `scripts/prepare-login-images.mjs` erzeugt.",
    "",
    "| Datei | Motiv | Stil | Fotograf | Lizenz | Quelle |",
    "|---|---|---|---|---|---|",
    ...TARGETS.map((t) => `| ${t.out} | ${t.motiv} | ${t.stil} | ${t.fotograf} | ${t.Lizenz} | ${t.page} |`),
    "",
    "Namensnennung ist laut Lizenz nicht Pflicht, steht hier aber der Fairness halber.",
    "Für das Logo sind Stockfotos ausgeschlossen (Spec 12.1).",
  ];
  return `${lines.join("\n")}\n`;
}

mkdirSync("tmp/login-src", { recursive: true });
mkdirSync("public/login", { recursive: true });

for (const t of TARGETS) {
  const bytes = await download(t.url);
  writeFileSync(`tmp/login-src/${t.out.replace(".webp", ".src")}`, bytes);

  let quality = 75;
  let out = await encode(bytes, quality);
  while (out.length > MAX_BYTES && quality > 50) {
    quality -= 5;
    out = await encode(bytes, quality);
  }

  writeFileSync(`public/login/${t.out}`, out);
  const kb = (out.length / 1024).toFixed(1);
  const flag = out.length > MAX_BYTES ? "ÜBER ZIEL" : "ok";
  console.log(`${t.out}  ${kb} KB  q${quality}  ${flag}`);
}

writeFileSync("public/login/CREDITS.md", credits());
console.log(`CREDITS.md mit ${TARGETS.length} Einträgen`);
