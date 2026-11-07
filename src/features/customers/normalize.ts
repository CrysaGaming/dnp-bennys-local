import { z } from "@/lib/zod";

/** Das Kennzeichen kommt aus dem Formular in jeder Schreibweise – gespeichert wird normalisiert. */
export function normalizePlate(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, " ");
}

export const PLATE_MESSAGE = "Kennzeichen: 1–8 Zeichen, nur A–Z, 0–9 und Leerzeichen";

export const plateSchema = z
  .string()
  .transform(normalizePlate)
  .refine((value) => /^[A-Z0-9 ]{1,8}$/.test(value), PLATE_MESSAGE);

export function phoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Kundennummer wie im Formular: `#0042`. */
export function formatCustomerNumber(n: number): string {
  return `#${String(n).padStart(4, "0")}`;
}
