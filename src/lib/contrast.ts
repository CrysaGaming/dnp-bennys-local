/**
 * WCAG-Contrast für die Design-Tokens (Spec 4.2 verlangt ≥ 4,5:1 für Text).
 * Die Werte in `src/app/globals.css` sind die Quelle, hier wird nur gerechnet.
 */

export type RGB = [number, number, number];

function kanalWert(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.2;
}

/** Relative Leuchtkraft nach WCAG 2.1. */
export function relativeLuminance(hex: string): number {
  const teile = hex.replace("#", "").match(/[\da-f]{2}/gi);
  if (!teile || teile.length !== 3) throw new Error(`Kein Hex-Farbwert: ${hex}`);
  const [r, g, b] = teile.map((h) => parseInt(h, 16));
  return 0.2126 * kanalWert(r!) + 0.7152 * kanalWert(g!) + 0.0722 * kanalWert(b!);
}

/**
 * Halbdeckendes Schwarz über einem Bild. Die Kanäle werden linear gedämpft, danach greift die
 * Transfer-Kurve – darum ist die Leuchtkraft nicht einfach `(1 - alpha)` mal der Bild-Leuchtkraft.
 */
export function blendOverBlack(rgb: RGB, alpha: number): RGB {
  const d = 1 - alpha;
  return [rgb[0] * d, rgb[1] * d, rgb[2] * d];
}

/** Contrast nach WCAG 2.1; as `number` wird ein Already-Luminanz-Wert angenommen. */
export function wcagContrast(a: string | number, b: string | number): number {
  const l1 = typeof a === "number" ? a : relativeLuminance(a);
  const l2 = typeof b === "number" ? b : relativeLuminance(b);
  const hell = Math.max(l1, l2);
  const dunkel = Math.min(l1, l2);
  return (hell + 0.05) / (dunkel + 0.05);
}
