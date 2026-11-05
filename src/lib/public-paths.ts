/**
 * Öffentliche Pfade für `src/proxy.ts` (Spec 3.2).
 * Alles hier wird ohne Session-Cookie durchgelassen; der Proxy prüft nie die DB.
 */

const PUBLIC_PREFIXES = ["/login", "/api/auth", "/api/health", "/audio"];

const PUBLIC_EXACT = new Set(["/", "/icon.svg", "/favicon.ico"]);

/** Assets (Bilder, Fonts, Musik) – Seitenpfade enden nie mit diesen Erweiterungen. */
const ASSET_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".avif",
  ".gif",
  ".svg",
  ".ico",
  ".mp3",
  ".ogg",
  ".woff2",
  ".woff",
];

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;

  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return true;
  }

  const lastSegment = pathname.split("/").pop() ?? "";
  return ASSET_EXTENSIONS.some((ext) => lastSegment.toLowerCase().endsWith(ext));
}
