import { Suspense } from "react";
import { requireSession } from "@/lib/dal";
import { PageHeader } from "@/components/layout/page-header";
import { PermissionToast } from "@/features/dashboard/components/permission-toast";
import { getDashboardStats, getOnDutyList, getRecentOrders, getRevenueLast7Days } from "@/features/dashboard/queries";
import { KpiCard } from "@/features/dashboard/components/kpi-card";
import { RevenueChart } from "@/features/dashboard/components/revenue-chart";
import { OnDutyList } from "@/features/dashboard/components/on-duty-list";
import { RecentOrders } from "@/features/dashboard/components/recent-orders";

type Props = { searchParams: Promise<{ fehler?: string }> };

async function Content({ searchParams }: Props) {
  const params = await searchParams;
  const ctx = await requireSession();

  const stats = await getDashboardStats();
  const days = await getRevenueLast7Days();
  const onDuty = await getOnDutyList();
  const recent = await getRecentOrders(10);

  return (
    <>
      {params.fehler === "berechtigung" && (
        <PermissionToast message="Dafür fehlt dir die Berechtigung." />
      )}

      <PageHeader title="Dashboard" breadcrumb={[{ label: "Übersicht", href: "/dashboard" }]} />

      <p className="text-sm text-muted-foreground mb-4">{ctx.name}</p>

      <div className="grid grid-cols-2 gap-4 mb-6 md:grid-cols-4">
        <KpiCard label="Offene Aufträge" value={stats.openOrders} />
        <KpiCard label="Umsatz heute" value={stats.revenueToday} money />
        <KpiCard label="Im Dienst" value={stats.onDuty.count} sub={`von ${stats.onDuty.total}`} />
        <KpiCard label="Lager" value={stats.lowStockParts} sub={`${stats.lowStockParts} knapp`} />
      </div>

      <RevenueChart days={days} />
      <OnDutyList rows={onDuty} />
      <RecentOrders rows={recent} />
    </>
  );
}

export default function DashboardPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<div>Wird geladen…</div>}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
