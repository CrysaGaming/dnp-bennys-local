import { Suspense } from "react";
import { requirePagePermission } from "@/lib/dal";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { listAudit } from "@/features/audit/queries";
import { AuditTable } from "@/features/audit/components/audit-table";

type Props = { searchParams: Promise<{ entity?: string; actor?: string; cursor?: string }> };

async function Content({ searchParams }: Props) {
  const ctx = await requirePagePermission("AUDIT_VIEW");
  const params = await searchParams;

  const { rows, nextCursor } = await listAudit(ctx, {
    entity: params.entity,
    actorId: params.actor,
    cursor: params.cursor,
  });

  const base = new URLSearchParams();
  if (params.entity) base.set("entity", params.entity);
  if (params.actor) base.set("actor", params.actor);

  const nextHref = nextCursor ? `/audit?${base.toString()}&cursor=${nextCursor}` : null;

  return (
    <>
      <PageHeader
        title="Audit-Log"
        breadcrumb={[{ label: "Dashboard", href: "/dashboard" }, { label: "Audit-Log" }]}
      />

      <form className="flex flex-wrap items-end gap-3 mb-4" method="get" action="/audit">
        <div className="flex flex-col gap-1">
          <Label htmlFor="audit-entity">Objekt</Label>
          <Input id="audit-entity" name="entity" defaultValue={params.entity ?? ""} placeholder="z. B. Resource" />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="audit-actor">Person</Label>
          <Input id="audit-actor" name="actor" defaultValue={params.actor ?? ""} placeholder="User-id" />
        </div>

        <Button type="submit">Filtern</Button>
      </form>

      <AuditTable rows={rows} nextHref={nextHref} />
    </>
  );
}

export default function AuditPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<div>Wird geladen…</div>}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
