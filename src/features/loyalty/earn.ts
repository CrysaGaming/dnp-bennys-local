import type { LoyaltySettings } from "@/generated/prisma/client";
import { formatMoney } from "@/lib/format";

/** Was die Berechnung braucht – ohne die Felder, die hier nichts angehen. */
export type EarnSettings = Pick<
  LoyaltySettings,
  "enabled" | "mode" | "stampsPerVisit" | "dollarsPerPoint" | "minVisitTotal" | "cooldownHours"
>;

/**
 * Gutschrift für einen Besuch (Spec 3.6). Die Sperrzeit ist erfüllt, wenn die Differenz
 * genau gleich groß ist – `>=`, nicht `>`.
 */
export function calcEarn(
  s: EarnSettings,
  invoiceAmount: number,
  lastVisitAt: Date | null,
  now: Date,
): number {
  if (!s.enabled) return 0;
  if (invoiceAmount < s.minVisitTotal) return 0;

  if (s.cooldownHours > 0 && lastVisitAt) {
    const hours = (now.getTime() - lastVisitAt.getTime()) / 3_600_000;
    if (hours < s.cooldownHours) return 0;
  }

  if (s.mode === "STAMPS") return s.stampsPerVisit;

  return Math.floor(invoiceAmount / s.dollarsPerPoint);
}

/** Beispielformel für die Einstellungsseite (Spec 3.6). */
export function exampleText(s: EarnSettings, amount: number): string {
  const money = formatMoney(amount);

  if (amount < s.minVisitTotal) {
    return `Beispiel: Rechnung ${money} → keine Gutschrift (Mindestbetrag ${formatMoney(s.minVisitTotal)})`;
  }

  // Das Beispiel zeigt, was bei Aktivierung pass – der aus-Schalter gehört nicht zur Rechnung.
  const earned = s.mode === "STAMPS" ? s.stampsPerVisit : Math.floor(amount / s.dollarsPerPoint);

  return `Beispiel: Rechnung ${money} → +${earned} ${s.mode === "STAMPS" ? "Stempel" : "Punkte"}`;
}
