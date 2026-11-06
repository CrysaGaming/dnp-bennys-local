import { Suspense } from "react";
import { requirePagePermission } from "@/lib/dal";
import { hasPermission } from "@/lib/permissions";
import { NotFoundError } from "@/lib/errors";
import { PageHeader } from "@/components/layout/page-header";
import { listEmployees } from "@/features/employees/service";
import { ranksBelowOwn } from "@/features/ranks/service";
import { EmployeeDetail } from "@/features/employees/components/employee-detail";

type Props = { params: Promise<{ id: string }> };

async function Content({ params }: Props) {
  const ctx = await requirePagePermission("EMPLOYEES_MANAGE");
  const { id } = await params;

  const employee = (await listEmployees(ctx)).find((e) => e.id === id);
  if (!employee) throw new NotFoundError();

  const ranks = await ranksBelowOwn(ctx);

  return (
    <>
      <PageHeader
        title={employee.name}
        breadcrumb={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Mitarbeiter", href: "/mitarbeiter" },
          { label: employee.name },
        ]}
      />

      <EmployeeDetail
        employee={employee}
        ranks={ranks.map((r) => ({ id: r.id, name: r.name, level: r.level }))}
        // Sich selbst sperren geht nicht (Spec 3.5) – darum gibt es hier auch keinen Knopf.
        canTerminate={hasPermission(ctx, "EMPLOYEES_MANAGE") && employee.id !== ctx.employeeId}
      />
    </>
  );
}

export default function MitarbeiterDetailPage({ params }: Props) {
  return (
    <Suspense fallback={<div>Wird geladen…</div>}>
      <Content params={params} />
    </Suspense>
  );
}
