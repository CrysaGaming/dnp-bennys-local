import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDuration } from "@/lib/format";
import type { OnDutyRow } from "../queries";

/** "Gerade im Dienst" (Spec 5.1). */
export function OnDutyList({ rows }: { rows: OnDutyRow[] }) {
  return (
    <section className="border border-border rounded-lg p-4 mb-6">
      <h2 className="font-display text-xl uppercase mb-3">Gerade im Dienst</h2>

      {rows.length === 0 ? <p className="text-sm text-muted-foreground">Niemand ist eingestempelt.</p> : null}

      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li key={row.employeeId} className="flex items-center gap-3">
            <Avatar className="size-8">
              <AvatarImage src={row.image ?? ""} alt={row.name} />
              <Fallbackinitials name={row.name} />
            </Avatar>

            <Link href={`/mitarbeiter/${row.employeeId}`} className="flex-1">
              {row.name}
            </Link>

            <span className="font-mono text-sm" style={{ color: row.rankColor }}>
              {formatDuration(row.minutes)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Fallbackinitials({ name }: { name: string }) {
  const initials = name.split(" ").map((part) => part[0] ?? "").join("").slice(0, 2).toUpperCase();
  return <AvatarFallback>{initials || "?"}</AvatarFallback>;
}
