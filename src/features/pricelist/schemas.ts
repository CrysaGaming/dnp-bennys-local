import { z } from "zod";

const wholeNumber = z.number().int("Ganze Zahlen");

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Kategoriename: 2–60 Zeichen")
    .max(60, "Kategoriename: 2–60 Zeichen"),
  sortOrder: wholeNumber.min(0, "Sortierung: 0 oder mehr").default(0),
});

export const priceItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Leistungsname: 2–60 Zeichen")
    .max(60, "Leistungsname: 2–60 Zeichen"),
  description: z
    .string()
    .trim()
    .max(200, "Beschreibung: höchstens 200 Zeichen")
    .optional(),
  price: wholeNumber
    .min(0, "Preis: ganze Dollar von 0 bis 10.000.000")
    .max(10_000_000, "Preis: ganze Dollar von 0 bis 10.000.000"),
  categoryId: z.string().min(1, "Kategorie fehlt."),
  partId: z
    .string()
    .trim()
    .optional()
    .transform((s) => (s === "" || s === undefined ? null : s)),
  partQuantity: wholeNumber.min(1, "Teilmenge: 1 bis 100").max(100, "Teilmenge: 1 bis 100").default(1),
  active: z.boolean().default(true),
  sortOrder: wholeNumber.min(0, "Sortierung: 0 oder mehr").default(0),
});

export type CategoryInput = z.input<typeof categorySchema>;
export type PriceItemInput = z.input<typeof priceItemSchema>;
