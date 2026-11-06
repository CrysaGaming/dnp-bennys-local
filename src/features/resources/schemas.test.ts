import { describe, expect, it } from "vitest";
import { resourceInputSchema } from "./schemas";

describe("Ressourcen-Eingabe", () => {
  it("Name wird normalisiert, Gewicht in Gramm, Punkt und Komma sind Trenner", () => {
    expect(
      resourceInputSchema.parse({
        name: " Kupferdraht ",
        weight: "1.500",
        exportPrice: "12",
        category: "INTERMEDIATE",
      }),
    ).toEqual({
      name: "Kupferdraht",
      weightGrams: 1500,
      exportPrice: 12,
      category: "INTERMEDIATE",
      note: null,
    });

    expect(
      resourceInputSchema.parse({ name: "Düse", weight: "0,250", exportPrice: 4, category: "RAW" }),
    ).toMatchObject({ weightGrams: 250 });
  });

  it("Gewicht außerhalb des Bereichs oder mit zu vielen Nachkommastellen", () => {
    expect(
      resourceInputSchema.safeParse({
        name: "X1",
        weight: "0,0005",
        exportPrice: 1,
        category: "RAW",
      }).error?.issues[0]?.message,
    ).toBe("Gewicht: 0 bis 10.000 kg, höchstens 3 Nachkommastellen");
  });

  it("Export-Preis nur in ganzen Dollar", () => {
    expect(
      resourceInputSchema.safeParse({
        name: "X1",
        weight: "1",
        exportPrice: "1,5",
        category: "RAW",
      }).error?.issues[0]?.message,
    ).toBe("Export-Preis: ganze Dollar von 0 bis 10.000.000");

    expect(
      resourceInputSchema.safeParse({
        name: "X1",
        weight: "1",
        exportPrice: 10_000_001,
        category: "RAW",
      }).error?.issues[0]?.message,
    ).toBe("Export-Preis: ganze Dollar von 0 bis 10.000.000");
  });

  it("Name braucht 2–60 Zeichen", () => {
    expect(
      resourceInputSchema.safeParse({ name: "X", weight: "1", exportPrice: 1, category: "RAW" })
        .error?.issues[0]?.message,
    ).toBe("Name: 2–60 Zeichen");
  });

  it("Notiz ist freiwillig und höchstens 200 Zeichen", () => {
    const ok = resourceInputSchema.safeParse({
      name: "Platine",
      weight: "2",
      exportPrice: 300,
      category: "FINAL",
      note: "  mit Stecker  ",
    });

    expect(ok.success).toBe(true);
    expect(ok.data?.note).toBe("mit Stecker");

    const tooLong = resourceInputSchema.safeParse({
      name: "Platine",
      weight: "2",
      exportPrice: 300,
      category: "FINAL",
      note: "x".repeat(201),
    });

    expect(tooLong.success).toBe(false);
  });
});
