import { Suspense } from "react";
import { requirePagePermission } from "@/lib/dal";
import { RouteModal } from "@/components/route-modal";
import { ranksBelowOwn } from "@/features/ranks/service";
import { EmployeeForm } from "@/features/employees/components/employee-form";

async function Content() {
  const ctx = await requirePagePermission("EMPLOYEES_MANAGE");
  const ranks = await ranksBelowOwn(ctx);

  return (
    <RouteModal
      title="Neuer Mitarbeiter"
      description="Der Startzugang muss beim ersten Login ein eigenes Passwort setzen."
      backHref="/mitarbeiter"
    >
      <EmployeeForm ranks={ranks.map((r) => ({ id: r.id, name: r.name, level: r.level }))} />
    </RouteModal>
  );
}

export default function NeuerMitarbeiterPage() {
  return (
    <Suspense fallback={<div>Wird geladen…</div>}>
      <Content />
    </Suspense>
  );
}
