import { z } from "zod";
import { Permission } from "@/generated/prisma/enums";

const PERMISSION_VALUES = Object.values(Permission) as [Permission, ...Permission[]];

/** Rang (Spec 5.9): Level 1–99, das Admin-Level 100 ist reserviert und geschützt. */
export const rankSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Bitte einen Rangnamen mit mindestens 2 Zeichen eingeben.")
    .max(30, "Höchstens 30 Zeichen."),
  level: z
    .number()
    .int("Das Level ist eine ganze Zahl.")
    .min(1, "Mindestens Level 1.")
    .max(99, "Das Level ist höchstens 99."),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Bitte eine Farbe als #RRGGBB angeben."),
  hourlyWage: z
    .number()
    .int("Der Stundenlohn ist eine ganze Zahl in Dollar.")
    .min(0, "Mindestens 0.")
    .max(100000, "Höchstens 100.000."),
  permissions: z.array(z.enum(PERMISSION_VALUES)),
});

export type RankInput = z.infer<typeof rankSchema>;
