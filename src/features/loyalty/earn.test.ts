import { describe, expect, it } from "vitest";
import { calcEarn, exampleText } from "./earn";
import type { EarnSettings } from "./earn";

const s: EarnSettings = {
  enabled: true,
  mode: "STAMPS",
  stampsPerVisit: 1,
  dollarsPerPoint: 100,
  minVisitTotal: 500,
  cooldownHours: 12,
};

const now = new Date("2026-11-05T12:00:00Z");

describe("Gutschrift berechnen", () => {
  it("aus, unter Mindestbetrag, normal", () => {
    expect(calcEarn({ ...s, enabled: false }, 1200, null, now)).toBe(0);
    expect(calcEarn(s, 499, null, now)).toBe(0);
    expect(calcEarn(s, 1200, null, now)).toBe(1);
  });

  it("PunkteModus rechnet den Rechnungsbetrag", () => {
    expect(calcEarn({ ...s, mode: "POINTS" }, 1200, null, now)).toBe(12);
    expect(calcEarn({ ...s, mode: "POINTS", dollarsPerPoint: 100 }, 1250, null, now)).toBe(12);
  });

  it("Sperrzeit: 11 Stunden nein, genau 12 Stunden ja", () => {
    expect(calcEarn(s, 1200, new Date("2026-11-05T01:00:00Z"), now)).toBe(0);
    expect(calcEarn(s, 1200, new Date("2026-11-05T00:00:00Z"), now)).toBe(1);
  });

  it("ohne Sperrzeit zählt jeder Besuch", () => {
    expect(calcEarn({ ...s, cooldownHours: 0 }, 1200, now, now)).toBe(1);
  });

  it("Beispieltexte für die Einstellungsseite", () => {
    expect(exampleText(s, 1200)).toBe("Beispiel: Rechnung $1.200 → +1 Stempel");
    expect(exampleText({ ...s, mode: "POINTS" }, 1200)).toBe("Beispiel: Rechnung $1.200 → +12 Punkte");
    expect(exampleText({ ...s, minVisitTotal: 1500 }, 1200)).toBe(
      "Beispiel: Rechnung $1.200 → keine Gutschrift (Mindestbetrag $1.500)",
    );
  });

  it("das Beispiel zeigt, was bei Aktivierung pass – auch wenn das System aus ist", () => {
    expect(exampleText({ ...s, enabled: false }, 1200)).toBe("Beispiel: Rechnung $1.200 → +1 Stempel");
  });
});
