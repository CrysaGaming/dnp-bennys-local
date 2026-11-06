import { Suspense } from "react";
import Link from "next/link";
import { requirePagePermission } from "@/lib/dal";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { listEmployees } from "@/features/employees/service";
import { EmployeeTable } from "@/features/employees/components/employee-table";

type Props = { searchParams: Promise<{ rang?: string }> };

async function Content({ searchParams }: Props) {
  const ctx = await requirePagePermission("EMPLOYEES_VIEW");
  const params = await searchParams;
  const employees = await listEmployees(ctx, { rankId: params.rang });

  return (
    <>
      <PageHeader
        title="Mitarbeiter"
        breadcrumb={[{ label: "Dashboard", href: "/dashboard" }, { label: "Mitarbeiter" }]}
        actions={
          <Button variant="outline" render={<Link href="/mitarbeiter/neu" />}>
            Neuer Mitarbeiter
          </Button>
        }
      />

      <EmployeeTable employees={employees} />
    </>
  );
}

export default function MitarbeiterPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<div>Wird geladen…</div>}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
