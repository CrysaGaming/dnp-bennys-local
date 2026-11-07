import { z } from "@/lib/zod";
import { parseKgToGrams } from "@/lib/format";

function isWholeDollar(value: unknown): boolean {
  if (typeof value === "number") {
    return Number.isInteger(value) && value >= 0 && value <= 10_000_000;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!/^\d+$/.test(trimmed)) return false;
    return Number(trimmed) <= 10_000_000;
  }

  return false;
}

/**
 * Eingabe wie im Formular: Gewicht in kg (Punkt oder Komma), Preis als Text oder Zahl.
 * output ist in Gramm und ganzen Dollar – so wie es in der Datenbank steht (Spec 5.8).
 */
export const resourceInputSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name: 2–60 Zeichen")
      .max(60, "Name: 2–60 Zeichen"),
    weight: z
      .string()
      .trim()
      .refine((v) => parseKgToGrams(v) !== null, "Gewicht: 0 bis 10.000 kg, höchstens 3 Nachkommastellen"),
    exportPrice: z
      .union([z.string(), z.number()])
      .refine(isWholeDollar, "Export-Preis: ganze Dollar von 0 bis 10.000.000"),
    category: z.enum(["RAW", "INTERMEDIATE", "FINAL"]),
    note: z.string().trim().max(200, "Notiz: höchstens 200 Zeichen").optional(),
  })
  .transform((v) => ({
    name: v.name,
    weightGrams: parseKgToGrams(v.weight) ?? 0,
    exportPrice: typeof v.exportPrice === "string" ? Number(v.exportPrice.trim()) : v.exportPrice,
    category: v.category,
    note: v.note && v.note.length > 0 ? v.note : null,
  }));

export type ResourceInput = z.input<typeof resourceInputSchema>;
export type ResourceValues = z.output<typeof resourceInputSchema>;
