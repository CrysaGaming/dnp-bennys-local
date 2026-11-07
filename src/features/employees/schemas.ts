import { z } from "@/lib/zod";
import { EmployeeStatus } from "@/generated/prisma/enums";

const nameField = z
  .string()
  .trim()
  .min(2, "Bitte einen Namen mit mindestens 2 Zeichen eingeben.")
  .max(40, "Höchstens 40 Zeichen.");

const usernameField = z
  .string()
  .trim()
  .min(3, "Benutzername hat mindestens 3 Zeichen.")
  .max(30, "Höchstens 30 Zeichen.")
  .regex(/^[a-zA-Z0-9_.]+$/, "Benutzername nur Buchstaben, Zahlen, Punkt und Unterstrich.");

const phoneField = z
  .string()
  .trim()
  .max(20, "Höchstens 20 Zeichen.")
  .transform((value) => (value === "" ? null : value));

/** Anlegen (Spec 3.5): Dienstnummer 1–9999, leeres Telefon wird `null`. */
export const employeeCreateSchema = z.object({
  name: nameField,
  username: usernameField,
  rankId: z.string().min(1, "Bitte einen Rang wählen."),
  serviceNumber: z
    .number()
    .int("Die Dienstnummer ist eine ganze Zahl.")
    .min(1, "Mindestens 1.")
    .max(9999, "Höchstens 9999."),
  phone: phoneField.nullish(),
});

/** Bearbeiten: der Benutzername bleibt, status nur ACTIVE oder ON_LEAVE (Terminieren ist eigener Schritt). */
export const employeeUpdateSchema = z.object({
  name: nameField,
  rankId: z.string().min(1, "Bitte einen Rang wählen."),
  serviceNumber: z
    .number()
    .int("Die Dienstnummer ist eine ganze Zahl.")
    .min(1, "Mindestens 1.")
    .max(9999, "Höchstens 9999."),
  phone: phoneField.nullish(),
  status: z.enum([EmployeeStatus.ACTIVE, EmployeeStatus.ON_LEAVE]),
  notes: z.string().trim().max(500, "Höchstens 500 Zeichen.").nullish(),
});

export type EmployeeCreateInput = z.infer<typeof employeeCreateSchema>;
export type EmployeeUpdateInput = z.infer<typeof employeeUpdateSchema>;
