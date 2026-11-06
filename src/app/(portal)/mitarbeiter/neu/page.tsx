import { Suspense } from "react";
import { requirePagePermission } from "@/lib/dal";
import { PageHeader } from "@/components/layout/page-header";
import { ranksBelowOwn } from "@/features/ranks/service";
import { EmployeeForm } from "@/features/employees/components/employee-form";

async function Content() {
  const ctx = await requirePagePermission("EMPLOYEES_MANAGE");
  const ranks = await ranksBelowOwn(ctx);

  return (
    <>
      <PageHeader
        title="Neuer Mitarbeiter"
        breadcrumb={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Mitarbeiter", href: "/mitarbeiter" },
          { label: "Neuer Mitarbeiter" },
        ]}
      />

      <EmployeeForm ranks={ranks.map((r) => ({ id: r.id, name: r.name, level: r.level }))} />
    </>
  );
}

export default function NeuerMitarbeiterPage() {
  return (
    <Suspense fallback={<div>Wird geladen…</div>}>
      <Content />
    </Suspense>
  );
}
