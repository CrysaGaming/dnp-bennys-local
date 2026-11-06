import { describe, expect, it } from "vitest";
import { entryMinutes, formatElapsed, sumMinutes, weekStartBerlin, wagePreview } from "./calc";

describe("calc", () => {
  it("rechnet eine closed entry in Minuten", () => {
    expect(
      entryMinutes(
        { clockIn: new Date("2026-11-05T10:00:00Z"), clockOut: new Date("2026-11-05T12:15:00Z") },
        new Date(),
      ),
    ).toBe(135);
  });

  it("rechnet eine offene entry bis jetzt, abgerundet", () => {
    expect(
      entryMinutes({ clockIn: new Date("2026-11-05T10:00:00Z"), clockOut: null }, new Date("2026-11-05T10:30:59Z")),
    ).toBe(30);
  });

  it("addiert mehrere Einträge", () => {
    const now = new Date("2026-11-05T18:00:00Z");
    const entries = [
      { clockIn: new Date("2026-11-05T09:00:00Z"), clockOut: new Date("2026-11-05T12:00:00Z") },
      { clockIn: new Date("2026-11-05T13:00:00Z"), clockOut: null },
    ];

    expect(sumMinutes(entries, now)).toBe(180 + 300);
  });

  it("Lohn-Vorschau pro Stunde", () => {
    expect(wagePreview(135, 900)).toBe(2025);
    expect(wagePreview(30, 900)).toBe(450);
  });

  it("Wochenstart ist Montag 00:00 in Berlin", () => {
    expect(weekStartBerlin(new Date("2026-11-05T12:00:00Z")).toISOString()).toBe("2026-11-01T23:00:00.000Z");
  });

  it("rechnet über die Sommerzeit", () => {
    expect(weekStartBerlin(new Date("2026-03-31T10:00:00Z")).toISOString()).toBe("2026-03-29T22:00:00.000Z");
  });

  it("stellt die laufende Zeit als hh:mm:ss dar", () => {
    expect(formatElapsed(5025000)).toBe("01:23:45");
    expect(formatElapsed(0)).toBe("00:00:00");
    expect(formatElapsed(9 * 60 * 1000)).toBe("00:09:00");
  });
});
