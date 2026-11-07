import { z } from "@/lib/zod";
import { CompanyStatusMode, LogoVariant } from "@/generated/prisma/enums";

/**
 * Firmeneinstellungen (Spec 5.10 / 5.11). Leere Felder werden im Service zu `null` –
 * das ist der Unterschied zwischen „nicht hinterlegt“ und „mit Wert“.
 */
export const companySettingsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Bitte einen Firmennamen mit mindestens 2 Zeichen eingeben.")
    .max(40, "Höchstens 40 Zeichen."),
  phone: z.string().trim().max(20, "Höchstens 20 Zeichen.").default(""),
  radioChannel: z.string().trim().max(10, "Höchstens 10 Zeichen.").default(""),
  radioPassword: z.string().trim().max(20, "Höchstens 20 Zeichen.").default(""),
  statusMode: z.enum([CompanyStatusMode.AUTO, CompanyStatusMode.MANUAL]),
  manualOpen: z.boolean(),
  minOnDuty: z
    .number()
    .int("Es sind ganze Mitarbeiter gemeint.")
    .min(1, "Mindestens 1.")
    .max(20, "Höchstens 20."),
  logoVariant: z.enum([LogoVariant.LOS_SANTOS, LogoVariant.VICE_CITY, LogoVariant.EMBLEM]),
});

export type CompanySettingsInput = z.infer<typeof companySettingsSchema>;
