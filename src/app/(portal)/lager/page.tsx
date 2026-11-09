import { Suspense } from "react";
import { requirePagePermission } from "@/lib/dal";
import { hasPermission } from "@/lib/permissions";
import { PageHeader } from "@/components/layout/page-header";
import { listParts } from "@/features/inventory/service";
import { PartDialog } from "@/features/inventory/components/part-dialog";
import { PartsTable } from "@/features/inventory/components/parts-table";

async function Content() {
  const ctx = await requirePagePermission("INVENTORY_VIEW");
  const parts = await listParts(ctx);

  // Das Recht wird in der Fachfunktion geprüft – hier nur, ob die Knöpfe gezeigt werden.
  const canManage = hasPermission(ctx, "INVENTORY_MANAGE");

  return (
    <>
      <PageHeader
        title="Lager"
        breadcrumb={[{ label: "Dashboard", href: "/dashboard" }, { label: "Lager" }]}
        actions={canManage ? <PartDialog /> : null}
      />

      <PartsTable parts={parts} canManage={canManage} />
    </>
  );
}

export default function LagerPage() {
  return (
    <Suspense fallback={<div>Wird geladen…</div>}>
      <Content />
    </Suspense>
  );
}
