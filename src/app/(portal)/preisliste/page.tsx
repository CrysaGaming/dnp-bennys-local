import { Suspense } from "react";
import { requireSession } from "@/lib/dal";
import { hasPermission } from "@/lib/permissions";
import { PageHeader } from "@/components/layout/page-header";
import { getPriceList } from "@/features/pricelist/service";
import { listParts } from "@/features/inventory/service";
import { PriceList } from "@/features/pricelist/components/price-list";

type Props = { searchParams: Promise<{ inaktive?: string }> };

async function Content({ searchParams }: Props) {
  // Die Preisliste ist für alle Mitarbeiter lesbar (Spec 5.7) – geschrieben wird nur mit
  // PRICELIST_MANAGE.
  const ctx = await requireSession();
  const canManage = hasPermission(ctx, "PRICELIST_MANAGE");
  const params = await searchParams;
  const includeInactive = params.inaktive === "1";

  const list = await getPriceList(ctx, { includeInactive });

  // Die Teil-Auswahl braucht das Recht auf das Lager – sonst bleibt sie weg.
  const parts = hasPermission(ctx, "INVENTORY_VIEW") ? await listParts(ctx) : null;

  return (
    <>
      <PageHeader
        title="Preisliste"
        breadcrumb={[{ label: "Dashboard", href: "/dashboard" }, { label: "Preisliste" }]}
      />

      <PriceList list={list} parts={parts} canManage={canManage} includeInactive={includeInactive} />
    </>
  );
}

export default function PreislistePage({ searchParams }: Props) {
  return (
    <Suspense fallback={<div>Wird geladen…</div>}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
