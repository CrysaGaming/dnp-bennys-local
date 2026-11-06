import { formatMoney } from "@/lib/format";
import type { LoyaltyMode } from "@/generated/prisma/enums";

/**
 * Der Toast nach dem Bezahlen (Plan 9.5). Nur Text, keine Seite – damit die Formel unabhängig
 * vom Dialog geprüft werden kann.
 */
export function paidToast(input: { mode: LoyaltyMode; earned: number; name: string }): string {
  if (input.earned <= 0) return "Bezahlt.";

  const unit = input.mode === "POINTS" ? "Punkte" : "Stempel";

  return `Bezahlt. +${input.earned} ${unit} für ${input.name}`;
}

/** Der Betrag auf der Rechnung – dieselbe Formel wie im Auftrag. */
export function invoiceAmountText(amount: number): string {
  return formatMoney(amount);
}
