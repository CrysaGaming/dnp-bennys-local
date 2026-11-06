import { Suspense } from "react";
import { requirePagePermission } from "@/lib/dal";
import { hasPermission } from "@/lib/permissions";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { listOrders } from "@/features/orders/service";
import { OrderTable } from "@/features/orders/components/order-table";
import { listEmployees } from "@/features/employees/service";

type Props = { searchParams: Promise<{ status?: string; typ?: string; mitarbeiter?: string; q?: string }> };

async function Content({ searchParams }: Props) {
  const ctx = await requirePagePermission("ORDERS_VIEW");
  const params = await searchParams;

  const rows = await listOrders(ctx, {
    status: params.status as never,
    type: params.typ as never,
    employeeId: params.mitarbeiter,
    q: params.q,
  });

  const employees = hasPermission(ctx, "EMPLOYEES_VIEW")
    ? (await listEmployees(ctx)).map((employee) => ({ id: employee.id, name: employee.name }))
    : [];

  return (
    <>
      <PageHeader
        title="Aufträge"
        breadcrumb={[{ label: "Dashboard", href: "/dashboard" }, { label: "Aufträge" }]}
        actions={
          hasPermission(ctx, "ORDERS_CREATE") ? (
            <Button variant="outline" render={<Link href="/auftraege/neu" />}>
              Neuer Auftrag
            </Button>
          ) : null
        }
      />

      <OrderTable
        rows={rows}
        filter={{ status: params.status, type: params.typ, employeeId: params.mitarbeiter, q: params.q }}
        employees={employees}
      />
    </>
  );
}

export default function Auftragsliste({ searchParams }: Props) {
  return (
    <Suspense fallback={<div>Wird geladen…</div>}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
