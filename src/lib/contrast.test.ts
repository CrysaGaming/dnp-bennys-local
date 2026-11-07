import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { blendOverBlack, relativeLuminance, wcagContrast, type RGB } from "./contrast";

/**
 * Spec 4.2 verlangt WCAG AA (≥ 4,5:1) für Text. Die Hex-Werte der Tokens stehen als Kommentar in
 * `src/app/globals.css` – der Test liest die Datei und rechnet nach, damit die Werte nicht wieder
 * davonlaufen.
 */
function tokens(block: "light" | "dark"): Record<string, string> {
  const css = readFileSync("src/app/globals.css", "utf8");
  const body =
    block === "light"
      ? (css.match(/:root,[^{]*\{([\s\S]*?)\}/)?.[1] ?? "")
      : (css.match(/\.dark\s*\{([\s\S]*?)\}/)?.[1] ?? "");
  const out: Record<string, string> = {};
  for (const line of body.split(/\r?\n/)) {
    // Entweder steht der Hex-Wert direkt, oder OKLCH mit dem Hex als Kommentar.
    const m = line.match(/--([\w-]+):\s*(#[0-9A-Fa-f]{6})\s*;|--([\w-]+):\s*[^;]+;\s*\/\* (#[0-9A-Fa-f]{6}) \*\//);
    if (!m) continue;
    const name = m[1] ?? m[3];
    const hex = m[2] ?? m[4];
    if (name && hex) out[name] = hex;
  }
  return out;
}

// Nur Tokens, die im UI als Text stehen (Labels, Werte, Status, Fehler, Links).
const TEXT = ["foreground", "muted-foreground", "success", "destructive", "accent-cyan"];

describe("Contrast der Design-Tokens (Spec 4.2)", () => {
  for (const block of ["light", "dark"] as const) {
    it(`${block}: Text auf Kartenfläche ≥ 4,5:1`, () => {
      const t = tokens(block);
      for (const name of TEXT) {
        expect(wcagContrast(t[name]!, t["card"]!), `${name} auf card`).toBeGreaterThanOrEqual(4.5);
      }
    });

    it(`${block}: Text auf Hintergrundfläche ≥ 4,5:1`, () => {
      const t = tokens(block);
      for (const name of TEXT) {
        expect(wcagContrast(t[name]!, t["background"]!), `${name} auf background`).toBeGreaterThanOrEqual(4.5);
      }
    });
  }

  it("Button-Text auf dem Primary ≥ 4,5:1", () => {
    for (const block of ["light", "dark"] as const) {
      const t = tokens(block);
      expect(wcagContrast(t["primary-foreground"]!, t["primary"]!), `primary (${block})`).toBeGreaterThanOrEqual(4.5);
    }
  });

  // Die Login-Karte ist Glas über dem Foto. Der schlechteste Fall ist `bg-01` (das hellste Bild):
  // mittleres Drittel, Mittelwert der Pixel [115, 88, 54], am 2026-11-07 gemessen. Die Deckkraft
  // kommt aus `.login-card` in `globals.css`.
  it("Text auf der Glas-Karte über dem hellsten Bild ≥ 4,5:1", () => {
    const css = readFileSync("src/app/globals.css", "utf8");
    const alpha = Number(css.match(/\.login-card \{[^}]*background: rgb\(0 0 0 \/ ([\d.]+)\)/)?.[1]);
    expect(Number.isFinite(alpha)).toBe(true);

    const bild: RGB = [115, 88, 54];
    const flaeche = relativeLuminanceRGB(blendOverBlack(bild, alpha));
    const t = tokens("dark");

    for (const name of TEXT) {
      expect(wcagContrast(t[name]!, flaeche), `${name} auf Glas-Karte (black/${alpha})`).toBeGreaterThanOrEqual(4.5);
    }
  });

  // Spec 6.2 verlangt den dunklen Schatten unten für das HUD. Ohne ihn steht der Tip-Text direkt
  // auf dem Bild: unterstes Drittel von `bg-01`, Mittelwert [71, 46, 15] – gemessen 2026-11-07.
  it("HUD-Text über dem Schatten ≥ 4,5:1", () => {
    const css = readFileSync("src/app/globals.css", "utf8");
    const alpha = Number(css.match(/\.login-shade \{[^}]*rgb\(0 0 0 \/ ([\d.]+)\)/)?.[1]);
    expect(Number.isFinite(alpha), ".login-shade fehlt in globals.css").toBe(true);

    const unten: RGB = [71, 46, 15];
    const flaeche = relativeLuminanceRGB(blendOverBlack(unten, alpha));
    const t = tokens("dark");

    for (const name of ["muted-foreground", "foreground"]) {
      expect(wcagContrast(t[name]!, flaeche), `${name} über black/${alpha}`).toBeGreaterThanOrEqual(4.5);
    }
  });
});

function relativeLuminanceRGB(rgb: RGB): number {
  return relativeLuminance("#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join(""));
}
