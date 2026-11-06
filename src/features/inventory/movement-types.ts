import type { StockMovementReason } from "@/generated/prisma/enums";

/** Bewegung in der Historie – Datum als ISO-Text, damit es im Client sicher ankommt. */
export type MovementRow = {
  id: string;
  delta: number;
  reason: StockMovementReason;
  note: string | null;
  at: string;
};
