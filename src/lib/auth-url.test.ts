import { describe, expect, it } from "vitest";
import { authBaseUrl } from "./auth-url";

/**
 `BETTER_AUTH_URL` kommt von Coolify oft ohne Schema – im Lauf vom 2026-11-07 war der Wert
 `bennys.crysatec.com:3000`. Better Auth wirft dann beim Import und der Container läuft in die
 Restart-Schleife. Darum wird der Wert normalisiert.
 */
describe("authBaseUrl", () => {
  it("lässt eine vollständige URL in Ruhe", () => {
    expect(authBaseUrl("http://localhost:3100")).toBe("http://localhost:3100");
    expect(authBaseUrl("https://bennys.crysatec.com")).toBe("https://bennys.crysatec.com");
  });

  it("setzt https vor, wenn das Schema fehlt", () => {
    expect(authBaseUrl("bennys.crysatec.com:3000")).toBe("https://bennys.crysatec.com:3000");
    expect(authBaseUrl("bennys.crysatec.com/")).toBe("https://bennys.crysatec.com");
  });

  it("fällt auf die lokale URL zurück, wenn nichts gesetzt ist", () => {
    expect(authBaseUrl(undefined)).toBe("http://localhost:3000");
    expect(authBaseUrl("")).toBe("http://localhost:3000");
  });
});
