"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import { CountUp } from "./count-up";

/** KPI-Karte (Spec 5.1) mit Hover-Lift. */
export function KpiCard({
  label,
  value,
  sub,
  money = false,
}: {
  label: string;
  value: number;
  sub?: string;
  money?: boolean;
}) {
  return (
    <Card data-kpi className="transition-transform duration-200 hover:-translate-y-0.5">
      <CardHeader>
        <CardTitle className="text-xs uppercase tracking-[0.18em]">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="font-mono text-2xl">
          <CountUp value={value} format={money ? formatMoney : (n) => String(n)} />
        </div>
        {sub ? <p className="mt-1 text-sm text-muted-foreground">{sub}</p> : null}
      </CardContent>
    </Card>
  );
}
