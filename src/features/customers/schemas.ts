import { z } from "@/lib/zod";
import { plateSchema } from "./normalize";

export const vehicleSchema = z.object({
  model: z
    .string()
    .trim()
    .min(1, "Modell: 1–40 Zeichen")
    .max(40, "Modell: 1–40 Zeichen"),
  plate: plateSchema,
  color: z
    .string()
    .trim()
    .max(20, "Farbe: höchstens 20 Zeichen")
    .default("")
    .transform((s) => (s === "" ? null : s)),
});

export const customerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name: 2–60 Zeichen")
    .max(60, "Name: 2–60 Zeichen"),
  phone: z
    .string()
    .trim()
    .max(20, "Rufnummer: höchstens 20 Zeichen")
    .default("")
    .transform((s) => (s === "" ? null : s)),
  notes: z
    .string()
    .trim()
    .max(500, "Notiz: höchstens 500 Zeichen")
    .default("")
    .transform((s) => (s === "" ? null : s)),
  vehicles: z.array(vehicleSchema).max(10, "Fahrzeuge: höchstens 10").default([]),
});

export type CustomerInput = z.input<typeof customerSchema>;
export type VehicleInput = z.input<typeof vehicleSchema>;
export type CustomerValues = z.output<typeof customerSchema>;
export type VehicleValues = z.output<typeof vehicleSchema>;
