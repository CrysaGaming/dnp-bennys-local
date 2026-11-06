"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { formatMoney } from "@/lib/format";
import type { RevenueDay } from "../queries";

// Die zwei Farben des Sunset-Verlaufs (Spec 5.2) – als Gradient, damit die Balken wirklich den Verlauf zeigen und nicht nur eine Einzelfarbe.
const chartConfig = {
  revenue: {
    label: "Umsatz",
    color: "oklch(0.706 0.206 25.9)",
  },
} satisfies ChartConfig;

/** Umsatz der letzten sieben Tage (Spec 5.1). */
export function RevenueChart({ days }: { days: RevenueDay[] }) {
  return (
    <section className="border border-border rounded-lg p-4 mb-6">
      <h2 className="font-display text-xl uppercase mb-3">Umsatz – letzte sieben Tage</h2>

      <ChartContainer config={chartConfig} className="h-40 w-full" aria-label="Umsatz der letzten sieben Tage">
        <BarChart data={days} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
          <defs>
            <linearGradient id="sunset-bars" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="oklch(0.662 0.2444 1.68)" />
              <stop offset="100%" stopColor="oklch(0.75 0.1668 50.54)" />
            </linearGradient>
          </defs>

          <CartesianGrid vertical={false} />

          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
          <YAxis
            width={56}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => formatMoney(Number(value))}
            fontSize={12}
          />

          <ChartTooltip content={<ChartTooltipContent />} />

          <Bar dataKey="revenue" fill="url(#sunset-bars)" radius={4} />
        </BarChart>
      </ChartContainer>
    </section>
  );
}
