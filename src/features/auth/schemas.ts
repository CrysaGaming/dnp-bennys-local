import { z } from "@/lib/zod";

/** Login – Benutzername wie in Spec 3.2 (keine E-Mail, keine Selbstregistrierung). */
export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Bitte einen Benutzername eingeben.")
    .max(30, "Höchstens 30 Zeichen.")
    .regex(/^[a-zA-Z0-9_.]+$/, "Nur Buchstaben, Zahlen, Punkt und Unterstrich."),
  password: z.string().min(1, "Bitte ein Passwort eingeben."),
});

export type LoginInput = z.infer<typeof loginSchema>;

/** Passwortwechsel – muss beim ersten Login durchgeführt werden (Spec 3.2). */
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Bitte das aktuelle Passwort eingeben."),
    newPassword: z.string().min(10, "Mindestens 10 Zeichen."),
    confirmPassword: z.string().min(1, "Bitte das neue Passwort bestätigen."),
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: "Das neue Passwort muss sich vom alten unterscheiden.",
    path: ["newPassword"],
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwort und Bestätigung stimmen nicht überein.",
    path: ["confirmPassword"],
  });

export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
