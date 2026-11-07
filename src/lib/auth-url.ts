/**
 * Better Auth verlangt eine Base-URL mit Schema. Coolify liefert die FQDN oft ohne – im Lauf vom
 * 2026-11-07 war der Wert `bennys.crysatec.com:3000`, und Better Auth warf beim Import:
 * „Invalid base URL … URL must include 'http://' or 'https://'“. Der Container lief in die
 * Restart-Schleife. Darum wird der Wert hier normalisiert.
 */
export function authBaseUrl(env: string | undefined = process.env.BETTER_AUTH_URL): string {
  const raw = (env ?? "").trim();

  if (raw === "") return "http://localhost:3000";
  if (/^https?:\/\//i.test(raw)) return raw.replace(/\/+$/, "");

  return `https://${raw.replace(/^\/+/, "").replace(/\/+$/, "")}`;
}
