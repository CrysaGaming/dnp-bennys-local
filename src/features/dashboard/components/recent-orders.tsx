import Link from "next/link";
import { formatMoney, formatDateTime } from "@/lib/format";
import { formatCustomerNumber } from "@/features/customers/normalize";
import type { RecentOrder } from "../queries";

/** "Letzte Aufträge" (Spec 5.1): zehn Einträge, jeder verlinkt auf die Detailseite. */
export function RecentOrders({ rows }: { rows: RecentOrder[] }) {
  return (
    <section className="border border-border rounded-lg p-4">
      <h2 className="font-display text-xl uppercase mb-3">Letzte Aufträge</h2>

      {rows.length === 0 ? <p className="text-sm text-muted-foreground">Keine Aufträge.</p> : null}

      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li key={row.number} className="flex flex-wrap items-center gap-3 text-sm">
            <Link href={`/auftraege/${row.number}`} className="font-mono">
              #{formatCustomerNumber(row.number)}
            </Link>

            <span className="flex-1">{row.customer}</span>

            <span className="text-muted-foreground">{row.plate ?? "–"}</span>

            <span className="font-mono">{formatMoney(row.total)}</span>

            <span className="text-xs text-muted-foreground">{formatDateTime(row.createdAt)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
