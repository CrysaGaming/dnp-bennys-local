import { formatMoney } from "@/lib/format";

/** Summenblock (Spec 5.6): Zwischensumme, Mitarbeiter-Rabatt, Treue-Rabatt, Gesamt. */
export function OrderTotals({
  subtotal,
  discountPercent,
  loyaltyDiscount,
  total,
}: {
  subtotal: number;
  discountPercent: number;
  loyaltyDiscount: number;
  total: number;
}) {
  return (
    <section className="border border-border rounded-lg p-4 mb-6">
      <h2 className="font-display text-xl uppercase mb-3">Summen</h2>

      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt>Zwischensumme</dt>
          <dd className="font-mono">{formatMoney(subtotal)}</dd>
        </div>

        <div className="flex justify-between gap-4">
          <dt>Rabatt {discountPercent} %</dt>
          <dd className="font-mono">{formatMoney(subtotal - afterDiscount(subtotal, discountPercent))}</dd>
        </div>

        <div className="flex justify-between gap-4">
          <dt>Treue-Rabatt</dt>
          <dd className="font-mono">{formatMoney(loyaltyDiscount)}</dd>
        </div>

        <div className="flex justify-between gap-4 border-t border-border pt-2 text-base font-semibold">
          <dt>Gesamt</dt>
          <dd className="font-mono">{formatMoney(total)}</dd>
        </div>
      </dl>
    </section>
  );
}

function afterDiscount(subtotal: number, percent: number): number {
  return Math.round(subtotal * (1 - percent / 100));
}
