import { describe, expect, it } from "vitest";
import { authBaseUrl, authSecret } from "./auth-url";

/**
 `BETTER_AUTH_URL` kommt von Coolify oft ohne Schema – im Lauf vom 2026-11-07 war der Wert
 `bennys.crysatec.com:3000`. Better Auth wirft dann beim Import und der Container läuft in die
 Restart-Schleife. Darum wird der Wert normalisiert, und `COOLIFY_URL` hat vorrang.
 */
describe("Base-URL für Better Auth", () => {
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

  it("nimmt COOLIFY_URL vor BETTER_AUTH_URL", () => {
    expect(authBaseUrl({ COOLIFY_URL: "https://bennys.crysatec.com", BETTER_AUTH_URL: "bennys.crysatec.com:3000" }))
      .toBe("https://bennys.crysatec.com");
    expect(authBaseUrl({ BETTER_AUTH_URL: "bennys.crysatec.com:3000" })).toBe("https://bennys.crysatec.com:3000");
  });
});

/**
 Der Build-Lauf von Coolify (2026-11-07, 15:50) hatte sechs dieser Meldungen:
 „You are using the default secret …“. Beim Prärendern ist die Runtime-Env noch nicht da. Der Build
 lief durch, aber die Meldung ist Müll und kann eine prärendered Seite kippen. Darum gibt es für den
 Build einen Platzhalter – in Produktion bleibt es beim Fehler, wenn das Secret fehlt.
 */
describe("Secret für Better Auth", () => {
  it("nimmt das Secret aus der Umgebung", () => {
    expect(authSecret({ BETTER_AUTH_SECRET: "ein-langes-zufälliges-secret" })).toBe("ein-langes-zufälliges-secret");
  });

  it("gibt im Build einen Platzhalter, wenn nichts gesetzt ist", () => {
    expect(authSecret({}, "phase-production-build")).toBe("build-time-placeholder");
  });

  it("läuft in Produktion ohne Secret in den Fehler – nicht in ein Standard-Secret", () => {
    expect(authSecret({}, undefined)).toBeUndefined();
  });
});
