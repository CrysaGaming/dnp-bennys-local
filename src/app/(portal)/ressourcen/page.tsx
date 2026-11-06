import { Suspense } from "react";
import { requirePagePermission } from "@/lib/dal";
import { hasPermission } from "@/lib/permissions";
import { PageHeader } from "@/components/layout/page-header";
import { listResources } from "@/features/resources/service";
import { parseResourceQuery } from "@/features/resources/logic";
import { ResourceBrowser } from "@/features/resources/components/resource-browser";
import type { ResourceViewRow } from "@/features/resources/components/types";

type Props = { searchParams: Promise<Record<string, string | undefined>> };

async function Content({ searchParams }: Props) {
  const ctx = await requirePagePermission("RESOURCES_VIEW");
  const params = await searchParams;

  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) sp.set(key, value);
  }

  const query = parseResourceQuery(sp);
  const rows = await listResources(ctx);
  const canManage = hasPermission(ctx, "RESOURCES_MANAGE");

  const viewRows: ResourceViewRow[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    weightGrams: r.weightGrams,
    exportPrice: r.exportPrice,
    note: r.note,
  }));

  return (
    <>
      <PageHeader
        title="Ressourcen"
        breadcrumb={[{ label: "Dashboard", href: "/dashboard" }, { label: "Ressourcen" }]}
        actions={
          <span className="text-sm text-muted-foreground">{viewRows.length} Einträge</span>
        }
      />

      <ResourceBrowser rows={viewRows} canManage={canManage} initialQuery={query} />
    </>
  );
}

export default function RessourcenPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<div>Wird geladen…</div>}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
