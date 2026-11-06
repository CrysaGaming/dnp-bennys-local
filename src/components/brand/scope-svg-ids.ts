/**
 * IDs in SVG-Markups sauber auseinanderhalten (Spec 5.11): stehen mehrere Logos auf
 * einer Seite (Logo-Vorschau, Header + Login), dürfen sich ihre Definitionen keine
 * `id` teilen – sonst gewinnt die erste Definition und das zweite Logo zeigt ins Leere.
 */
export function scopeSvgIds(markup: string, prefix: string): string {
  return markup
    .replace(/id="([^"]+)"/g, (_match, id: string) => `id="${prefix}-${id}"`)
    .replace(/url\(#([^)]+)\)/g, (_match, id: string) => `url(#${prefix}-${id})`)
    .replace(/(xlink:)?href="#([^"]+)"/g, (_match, pfx: string, id: string) => `${pfx}href="#${prefix}-${id}"`);
}
