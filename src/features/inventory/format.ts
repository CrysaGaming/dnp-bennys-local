import type { StockMovementReason } from "@/generated/prisma/enums";

const LABEL: Record<StockMovementReason, string> = {
  PURCHASE: "Wareneingang",
  ORDER_USAGE: "Entnahme",
  CORRECTION: "Korrektur",
  LOSS: "Verlust",
};

export function reasonLabel(reason: StockMovementReason): string {
  return LABEL[reason];
}

/** Die Bewegung steht in der Historie als "+3 Stk" oder "-4 Stk". */
export function formatDelta(delta: number, unit: string): string {
  return `${delta > 0 ? "+" : ""}${delta} ${unit}`;
}
