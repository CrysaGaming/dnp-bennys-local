/**
 * Better Auth verlangt eine Base-URL mit Schema. Coolify liefert die FQDN oft ohne – im Lauf vom
 * 2026-11-07 war der Wert `bennys.crysatec.com:3000`, und Better Auth warf beim Import:
 * „Invalid base URL … URL must include 'http://' or 'https://'“. Der Container lief in die
 * Restart-Schleife. Darum wird der Wert normalisiert.
 *
 * `COOLIFY_URL` ist die öffentliche URL, die Coolify in den Container steckt (mit Schema, ohne Port).
 * Die FQDN-Variable aus der Compose kann den Port enthalten – für Cookie- und Redirect-URLs ist das
 * falsch, darum hat `COOLIFY_URL` Vorrang.
 */
export function normalizeBaseUrl(raw: string | undefined): string {
  const value = (raw ?? "").trim();

  if (value === "") return "http://localhost:3000";
  if (/^https?:\/\//i.test(value)) return value.replace(/\/+$/, "");

  return `https://${value.replace(/^\/+/, "").replace(/\/+$/, "")}`;
}

export function authBaseUrl(
  input: string | Record<string, string | undefined> | undefined = process.env,
): string {
  if (typeof input === "string") return normalizeBaseUrl(input);

  const env = input ?? {};
  return normalizeBaseUrl(env.COOLIFY_URL || env.BETTER_AUTH_URL);
}

/**
 * Beim Prärendern (Build) ist die Runtime-Env noch nicht da – Coolify-Lauf vom 15:50 zeigte sechs
 * Meldungen „You are using the default secret“. Für den Build gibt es darum einen Platzhalter. In
 * Produktion soll Better Auth weiter ohne Secretfehler bleiben, wenn das Secret fehlt.
 */
export function authSecret(
  env: Record<string, string | undefined> = process.env,
  phase: string | undefined = process.env.NEXT_PHASE,
): string | undefined {
  const raw = (env.BETTER_AUTH_SECRET ?? "").trim();
  if (raw !== "") return raw;

  return phase === "phase-production-build" ? "build-time-placeholder" : undefined;
}
