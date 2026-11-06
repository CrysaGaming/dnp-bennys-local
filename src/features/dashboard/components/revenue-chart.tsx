"use client";

import { formatMoney } from "@/lib/format";
import type { RevenueDay } from "../queries";

/**
 * Umsatz der letzten sieben Tage (Spec 5.1). Kein Chart-Paket – sieben Balken reichen und die
 * Balkenhöhe ist eine Breite in Prozent, damit reduzierte Bewegung nichts umschalten muss.
 */
export function RevenueChart({ days }: { days: RevenueDay[] }) {
  const max = Math.max(1, ...days.map((day) => day.revenue));

  return (
    <section className="border border-border rounded-lg p-4 mb-6">
      <h2 className="font-display text-xl uppercase mb-3">Umsatz – letzte sieben Tage</h2>

      <div className="flex items-end gap-2 h-32">
        {days.map((day) => (
          <div key={day.label} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="bg-sunset w-full rounded-t"
              style={{ height: `${Math.round((day.revenue / max) * 100)}%` }}
              aria-hidden
            />
            <span className="text-xs text-muted-foreground">{day.label}</span>
            <span className="sr-only">{formatMoney(day.revenue)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
