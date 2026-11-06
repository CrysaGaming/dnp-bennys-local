import { z } from "zod";
import { ThemePreference } from "@/generated/prisma/enums";

/** Eigenes Profil (Spec 5.12): nur Name und Telefon, der Rang wird nicht angefasst. */
export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Bitte einen Namen mit mindestens 2 Zeichen eingeben.")
    .max(40, "Höchstens 40 Zeichen."),
  phone: z.string().trim().max(20, "Höchstens 20 Zeichen.").nullish(),
});

/** Eigene Einstellungen (Spec 5.12). Musik kommt in Phase 3 dazu. */
export const preferencesSchema = z.object({
  theme: z.enum([ThemePreference.SYSTEM, ThemePreference.LIGHT, ThemePreference.DARK]),
  reducedMotion: z.boolean(),
});

export const avatarSchema = z.object({
  url: z.string().max(200).nullish(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type PreferencesInput = z.infer<typeof preferencesSchema>;

/** Musik im Dashboard (Spec 6.4): Lautstärke als ganze Zahl 0–100. */
export const musicPreferenceSchema = z.object({
  dashboardMusic: z.boolean(),
  musicVolume: z
    .number()
    .int("Die Lautstärke ist eine ganze Zahl.")
    .min(0, "Mindestens 0.")
    .max(100, "Höchstens 100."),
});

export type MusicPreferenceInput = z.infer<typeof musicPreferenceSchema>;
