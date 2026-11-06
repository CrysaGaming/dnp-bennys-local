import { Suspense } from "react";
import Link from "next/link";
import { requireSession } from "@/lib/dal";
import { hasPermission } from "@/lib/permissions";
import { PageHeader } from "@/components/layout/page-header";
import { formatDuration, formatMoney } from "@/lib/format";
import { sumMinutes, wagePreview, weekStartBerlin } from "@/features/time/calc";
import { listEntries } from "@/features/time/service";
import { listEmployees } from "@/features/employees/service";
import { TimeTable } from "@/features/time/components/time-table";

type Props = { searchParams: Promise<{ woche?: string; mitarbeiter?: string }> };

const DAY_MS = 24 * 60 * 60 * 1000;

/** Dienstzeiten einer Woche (Spec 5.7): eigene Zeiten immer, fremde nur mit TIMES_VIEW_ALL. */
async function Content({ searchParams }: Props) {
  const ctx = await requireSession({ allowMustChangePassword: true });
  const params = await searchParams;

  const now = new Date();
  const weekStart = params.woche ? weekStartBerlin(new Date(`${params.woche}T12:00:00Z`)) : weekStartBerlin(now);

  const kannFremde = hasPermission(ctx, "TIMES_VIEW_ALL");
  const targetId = kannFremde && params.mitarbeiter ? params.mitarbeiter : ctx.employeeId;

  const employees = await listEmployees(ctx);
  const target = employees.find((e) => e.id === targetId);

  const entries = await listEntries(ctx, { employeeId: targetId, weekStart });
  const minutes = sumMinutes(entries, now);

  const asDate = (d: Date) => d.toISOString().slice(0, 10);
  const link = (start: Date) =>
    `/dienstzeiten?woche=${asDate(start)}${targetId !== ctx.employeeId ? `&mitarbeiter=${targetId}` : ""}`;

  return (
    <>
      <PageHeader
        title="Dienstzeiten"
        breadcrumb={[{ label: "Dashboard", href: "/dashboard" }, { label: "Dienstzeiten" }]}
      />

      <div className="mb-4 flex items-center gap-3">
        <Link href={link(new Date(weekStart.getTime() - 7 * DAY_MS))}>Vor</Link>
        <p className="font-mono tabular-nums">{asDate(weekStart)}</p>
        <Link href={link(new Date(weekStart.getTime() + 7 * DAY_MS))}>Weiter</Link>
      </div>

      {kannFremde ? (
        <form method="get" className="mb-4 flex flex-wrap items-center gap-2">
          <input type="hidden" name="woche" value={asDate(weekStart)} />
          <label htmlFor="mitarbeiter">Mitarbeiter</label>
          <select id="mitarbeiter" name="mitarbeiter" defaultValue={targetId}>
            <option value={ctx.employeeId}>Ich</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
          <button type="submit">Anzeigen</button>
        </form>
      ) : null}

      <TimeTable entries={entries} canCorrect={hasPermission(ctx, "TIMES_MANAGE")} />

      <p className="mt-4 flex flex-wrap gap-4 font-mono tabular-nums">
        <span>{formatDuration(minutes)}</span>
        {target ? <span>Lohn-Vorschau: {formatMoney(wagePreview(minutes, target.rank.hourlyWage))}</span> : null}
      </p>
    </>
  );
}

export default function DienstzeitenPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<div>Wird geladen…</div>}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
