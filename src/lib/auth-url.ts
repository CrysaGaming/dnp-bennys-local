/**
 * Better Auth verlangt eine Base-URL mit Schema. Coolify liefert die FQDN oft ohne – im Lauf vom
 * 2026-11-07 war der Wert `bennys.crysatec.com:3000`, und Better Auth warf beim Import:
 * „Invalid base URL … URL must include 'http://' or 'https://'“. Der Container lief in die
 * Restart-Schleife. Darum wird der Wert normalisiert.
 *
 * `COOLIFY_URL` ist die öffentliche URL, die Coolify in den Container steckt (mit Schema, ohne
 * Port). `SERVICE_FQDN_<dienst>_<port>` aus der Compose kann den Port enthalten – für Cookie- und
 * Redirect-URLs ist das falsch, darum wird zuerst `COOLIFY_URL` genommen.
 */
export function normalizeBaseUrl(raw: string | undefined): string {
  const value = (raw ?? "").trim();

  if (value === "") return "http://localhost:3000";
  if (/^https?:\/\//i.test(value)) return value.replace(/\/+$/, "");

  return `https://${value.replace(/^\/+/, "").replace(/\/+$/, "")}`;
}

export function authBaseUrl(env: Record<string, string | undefined> = process.env): string {
  return normalizeBaseUrl(env.COOLIFY_URL || env.BETTER_AUTH_URL);
}
