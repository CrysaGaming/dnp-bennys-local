import { describe, it, expect } from "vitest";
import {
  formatMoney,
  formatKg,
  parseKgToGrams,
  formatDateTime,
  formatDuration,
  formatRadio,
} from "./format";

describe("format", () => {
  it("formatiert Geld", () => {
    expect(formatMoney(12500)).toBe("$12.500");
    expect(formatMoney(0)).toBe("$0");
    expect(formatMoney(-250)).toBe("-$250");
  });

  it("formatiert Gewicht in kg", () => {
    expect(formatKg(1500)).toBe("1,5 kg");
    expect(formatKg(25000)).toBe("25 kg");
    expect(formatKg(125)).toBe("0,125 kg");
  });

  it("liest kg-Eingaben (Punkt oder Komma als Dezimaltrenner)", () => {
    expect(parseKgToGrams("1,5")).toBe(1500);
    expect(parseKgToGrams("1.5")).toBe(1500);
    expect(parseKgToGrams("1.500")).toBe(1500); // Review Focus 1: Punkt = Dezimaltrenner
    expect(parseKgToGrams(" 2 ")).toBe(2000);
    expect(parseKgToGrams("10000")).toBe(10_000_000);
  });

  it("lehnt unmögliche kg-Werte ab", () => {
    expect(parseKgToGrams("0,0005")).toBeNull(); // mehr als 3 Nachkommastellen
    expect(parseKgToGrams("10000,001")).toBeNull(); // über 10.000 kg
    expect(parseKgToGrams("-1")).toBeNull();
    expect(parseKgToGrams("abc")).toBeNull();
  });

  it("zeigt UTC-Zeit in Europe/Berlin", () => {
    expect(formatDateTime(new Date("2026-11-05T23:30:00Z"))).toBe("06.11.2026, 00:30");
  });

  it("formatiert Dauer als Stunden:Minuten", () => {
    expect(formatDuration(135)).toBe("2:15 h");
    expect(formatDuration(5)).toBe("0:05 h");
  });

  it("formatiert den Funkkanal", () => {
    expect(formatRadio("1234", "0000")).toBe("Funk 1234 (0000)");
    expect(formatRadio("1234", null)).toBe("Funk 1234");
    expect(formatRadio(null, "0000")).toBeNull();
    expect(formatRadio("  ", null)).toBeNull();
  });
});
