import { z } from "@/lib/zod";

const wholeNumber = z.number().int("Ganze Zahlen");

export const partSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Teilname: 2–60 Zeichen")
    .max(60, "Teilname: 2–60 Zeichen"),
  sku: z
    .string()
    .trim()
    .max(30, "Artikelnummer: höchstens 30 Zeichen")
    .default("")
    .transform((s) => (s === "" ? null : s)),
  unit: z
    .string()
    .trim()
    .min(1, "Einheit: 1–10 Zeichen")
    .max(10, "Einheit: 1–10 Zeichen")
    .default("Stk"),
  minStock: wholeNumber.min(0, "Mindestbestand: 0 oder mehr").default(0),
  purchasePrice: wholeNumber
    .min(0, "EK-Preis: ganze Dollar ab 0")
    .default(0),
});

/** ORDER_USAGE bucht der Auftrag, niemand im Lager von Hand. */
const manualKind = z.enum(["PURCHASE", "CORRECTION", "LOSS"]);

export const bookingSchema = z
  .object({
    partId: z.string().min(1, "Teil fehlt."),
    kind: manualKind,
    amount: wholeNumber.refine((n) => n !== 0, "Menge: 0 ist keine Buchung."),
    note: z.string().trim().max(200, "Notiz: höchstens 200 Zeichen").optional(),
  })
  .superRefine((val, ctx) => {
    if (val.kind === "CORRECTION" || val.kind === "LOSS") {
      if (!val.note || val.note.length < 3) {
        ctx.addIssue({
          code: "custom",
          path: ["note"],
          message: "Notiz: mindestens 3 Zeichen.",
        });
      }
    }

    // Wareneingang und Verlust wirken ins Lager hinein, eine Korrektur in beide Richtungen.
    if ((val.kind === "PURCHASE" || val.kind === "LOSS") && val.amount <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["amount"],
        message:
          val.kind === "PURCHASE"
            ? "Wareneingang: die Menge muss größer als 0 sein."
            : "Verlust: die Menge muss größer als 0 sein.",
      });
    }
  });

export type PartInput = z.input<typeof partSchema>;
export type BookingInput = z.input<typeof bookingSchema>;
