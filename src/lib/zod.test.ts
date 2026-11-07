import { describe, expect, it } from "vitest";
import { z } from "./zod.js";

/**
 * Die CSP des Portals lässt im Browser kein `new Function` zu (Spec 13.6, `script-src` ohne
 * `unsafe-eval`). Zod v4 prüft beim Parsen, ob es kompilieren darf, und ruft dafür `Function("")`
 * auf. Im jitless-Modus bleibt sie der Probe fern – genau das prüft dieser Test.
 */
describe("zod-Konfiguration", () => {
  it("pars ohne neue Function – sonst verbietet die CSP es", () => {
    const g = globalThis as { Function?: FunctionConstructor };
    const real = g.Function;
    g.Function = (() => {
      throw new Error("new Function ist bei CSP nicht erlaubt");
    }) as unknown as FunctionConstructor;

    try {
      expect(z.object({ name: z.string().min(1) }).parse({ name: "Ben" })).toEqual({ name: "Ben" });
    } finally {
      g.Function = real;
    }
  });
});
