import { z } from "zod";

const wholeNumber = z.number().int("Ganze Zahlen");

export const loyaltySettingsSchema = z.object({
  enabled: z.boolean().default(false),
  mode: z.enum(["STAMPS", "POINTS"]).default("STAMPS"),
  stampsPerVisit: wholeNumber.min(1, "Stempel pro Besuch: 1–10").max(10, "Stempel pro Besuch: 1–10").default(1),
  cardSize: wholeNumber.min(4, "Kartengröße: 4–20").max(20, "Kartengröße: 4–20").default(10),
  dollarsPerPoint: wholeNumber
    .min(1, "Dollar pro Punkt: 1–100.000")
    .max(100_000, "Dollar pro Punkt: 1–100.000")
    .default(100),
  minVisitTotal: wholeNumber
    .min(0, "Mindestbetrag: 0–10.000.000")
    .max(10_000_000, "Mindestbetrag: 0–10.000.000")
    .default(500),
  cooldownHours: wholeNumber.min(0, "Sperrzeit: 0–168 Stunden").max(168, "Sperrzeit: 0–168 Stunden").default(12),
});

export const rewardSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Prämienname: 2–40 Zeichen")
      .max(40, "Prämienname: 2–40 Zeichen"),
    description: z
      .string()
      .trim()
      .max(200, "Beschreibung: höchstens 200 Zeichen")
      .default("")
      .transform((s) => (s === "" ? null : s)),
    cost: wholeNumber.min(1, "Kosten: 1–1000").max(1000, "Kosten: 1–1000"),
    type: z.enum(["PERCENT_DISCOUNT", "FIXED_DISCOUNT", "FREE_SERVICE"]),
    value: wholeNumber.default(0),
    priceListItemId: z
      .string()
      .trim()
      .default("")
      .transform((s) => (s === "" ? null : s)),
    sortOrder: wholeNumber.min(0, "Sortierung: 0 oder mehr").default(0),
  })
  .superRefine((reward, ctx) => {
    // Eine Gratisleistung braucht die Leistung – ohne sie ist die Prämie nichts wert.
    if (reward.type === "FREE_SERVICE") {
      if (!reward.priceListItemId) {
        ctx.addIssue({ code: "custom", path: ["priceListItemId"], message: "Bitte eine Leistung wählen" });
      }
      if (reward.value !== 0) {
        ctx.addIssue({ code: "custom", path: ["value"], message: "Bei einer Gratisleistung ist der Wert 0" });
      }
      return;
    }

    if (reward.type === "PERCENT_DISCOUNT") {
      if (reward.value < 1 || reward.value > 100) {
        ctx.addIssue({ code: "custom", path: ["value"], message: "Prozent: 1–100" });
      }
      return;
    }

    if (reward.value < 1 || reward.value > 10_000_000) {
      ctx.addIssue({ code: "custom", path: ["value"], message: "Dollar: 1–10.000.000" });
    }
  });

export const adjustSchema = z.object({
  customerId: z.string().min(1, "Kunde fehlt."),
  amount: wholeNumber.refine((n) => n !== 0, "Betrag: 0 ist keine Buchung."),
  note: z
    .string()
    .trim()
    .min(3, "Notiz: mindestens 3 Zeichen")
    .max(200, "Notiz: höchstens 200 Zeichen"),
});

export type LoyaltySettingsInput = z.input<typeof loyaltySettingsSchema>;
export type RewardInput = z.input<typeof rewardSchema>;
export type AdjustInput = z.input<typeof adjustSchema>;
