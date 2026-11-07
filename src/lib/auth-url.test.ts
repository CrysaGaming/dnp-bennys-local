import { describe, expect, it } from "vitest";
import { authBaseUrl, normalizeBaseUrl } from "./auth-url";

/**
 `BETTER_AUTH_URL` kommt von Coolify oft ohne Schema – im Lauf vom 2026-11-07 war der Wert
 `bennys.crysatec.com:3000`. Better Auth wirft dann beim Import und der Container läuft in die
 Restart-Schleife. Darum wird der Wert normalisiert, und `COOLIFY_URL` hat vorrang.
 */
describe("Base-URL für Better Auth", () => {
  it("lässt eine vollständige URL in Ruhe", () => {
    expect(normalizeBaseUrl("http://localhost:3100")).toBe("http://localhost:3100");
    expect(normalizeBaseUrl("https://bennys.crysatec.com")).toBe("https://bennys.crysatec.com");
  });

  it("setzt https vor, wenn das Schema fehlt", () => {
    expect(normalizeBaseUrl("bennys.crysatec.com:3000")).toBe("https://bennys.crysatec.com:3000");
    expect(normalizeBaseUrl("bennys.crysatec.com/")).toBe("https://bennys.crysatec.com");
  });

  it("fällt auf die lokale URL zurück, wenn nichts gesetzt ist", () => {
    expect(normalizeBaseUrl(undefined)).toBe("http://localhost:3000");
    expect(normalizeBaseUrl("")).toBe("http://localhost:3000");
  });

  it("nimmt COOLIFY_URL vor BETTER_AUTH_URL", () => {
    expect(authBaseUrl({ COOLIFY_URL: "https://bennys.crysatec.com", BETTER_AUTH_URL: "bennys.crysatec.com:3000" }))
      .toBe("https://bennys.crysatec.com");
    expect(authBaseUrl({ BETTER_AUTH_URL: "bennys.crysatec.com:3000" })).toBe("https://bennys.crysatec.com:3000");
  });
});
