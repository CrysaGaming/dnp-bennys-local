import { z } from "zod";

/** Korrektur einer Dienstzeit (Spec 5.7): Notiz Pflicht, Ende nach Beginn. */
export const correctEntrySchema = z
  .object({
    clockIn: z.date({ message: "Bitte einen Beginn angeben." }),
    clockOut: z.date({ message: "Bitte ein Ende angeben." }).nullable(),
    note: z
      .string()
      .trim()
      .min(3, "Die Notiz hat mindestens 3 Zeichen.")
      .max(200, "Höchstens 200 Zeichen."),
  })
  .refine((data) => !data.clockOut || data.clockOut > data.clockIn, {
    message: "Ende muss nach Beginn liegen",
    path: ["clockOut"],
  });

export type CorrectEntryInput = z.infer<typeof correctEntrySchema>;
