import { describe, expect, it } from "vitest";
import { berlinDayStart, berlinLabel, lastNDaysBerlin } from "./days";

describe(" Berliner Tagesgrenzen ", () => {
  it("der Tag beginnt in Berlin, nicht in UTC", () => {
    // 23:30 UTC ist 00:30 in Berlin – das gehört schon zum 6. November.
    expect(berlinDayStart(new Date("2026-11-05T23:30:00Z")).toISOString()).toBe(
      "2026-11-05T23:00:00.000Z",
    );

    // Und 22:30 UTC ist 23:30 in Berlin – das gehört noch zum 5. November.
    expect(berlinDayStart(new Date("2026-11-05T22:30:00Z")).toISOString()).toBe(
      "2026-11-04T23:00:00.000Z",
    );
  });

  it("sieben Tage mit Label", () => {
    const days = lastNDaysBerlin(7, new Date("2026-11-05T12:00:00Z"));

    expect(days.map((d) => d.label)).toEqual([
      "30.10.",
      "31.10.",
      "01.11.",
      "02.11.",
      "03.11.",
      "04.11.",
      "05.11.",
    ]);

    expect(days[0]!.start.toISOString()).toBe("2026-10-29T23:00:00.000Z"); // 00:00 Berliner Zeit am 30.10.
    expect(days[6]!.end.toISOString()).toBe("2026-11-05T23:00:00.000Z");
  });

  it("Sommerzeit verschiebt den Tag um eine Stunde", () => {
    expect(berlinDayStart(new Date("2026-06-15T00:30:00Z")).toISOString()).toBe(
      "2026-06-14T22:00:00.000Z",
    );
  });

  it("Label", () => {
    expect(berlinLabel(new Date("2026-11-05T22:30:00Z"))).toBe("05.11.");
  });
});
