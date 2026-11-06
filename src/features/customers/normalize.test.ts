import { describe, expect, it } from "vitest";
import { formatCustomerNumber, normalizePlate, phoneDigits, plateSchema } from "./normalize";

describe("Kennzeichen, Telefon, Kundennummer", () => {
  it("normalisiert das Kennzeichen (Review Focus 4)", () => {
    expect(normalizePlate("  8ben  42 ")).toBe("8BEN 42");
    expect(normalizePlate("vice86")).toBe("VICE86");
    expect(normalizePlate("Bmm   42")).toBe("BMM 42");
  });

  it("Schema prüft nach der Normalisierung", () => {
    expect(plateSchema.safeParse("ZUVIEL123").success).toBe(false);
    expect(plateSchema.safeParse("  8ben  42 ").success).toBe(true);
    expect(plateSchema.parse("  8ben  42 ")).toBe("8BEN 42");
  });

  it("Fehlermeldung nennt erlaubte Zeichen", () => {
    expect(plateSchema.safeParse("ZUVIEL123").error?.issues[0]?.message).toBe(
      "Kennzeichen: 1–8 Zeichen, nur A–Z, 0–9 und Leerzeichen",
    );
  });

  it("Telefon: nur Ziffern", () => {
    expect(phoneDigits("555-01 23")).toBe("5550123");
    expect(phoneDigits("(555) 0123")).toBe("5550123");
    expect(phoneDigits("")).toBe("");
  });

  it("Kundennummer mit vier Stellen", () => {
    expect(formatCustomerNumber(42)).toBe("#0042");
    expect(formatCustomerNumber(1)).toBe("#0001");
    expect(formatCustomerNumber(12000)).toBe("#12000");
  });
});
