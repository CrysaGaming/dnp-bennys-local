import { Suspense } from "react";
import { requireSession } from "@/lib/dal";
import { PageHeader } from "@/components/layout/page-header";
import { PermissionToast } from "@/features/dashboard/components/permission-toast";

type Props = { searchParams: Promise<{ fehler?: string }> };

async function Content({ searchParams }: Props) {
  const params = await searchParams;
  const ctx = await requireSession();

  return (
    <>
      {params.fehler === "berechtigung" && (
        <PermissionToast message="Dafür fehlt dir die Berechtigung." />
      )}

      <PageHeader title="Dashboard" breadcrumb={[{ label: "Übersicht", href: "/dashboard" }]} />

      <p className="text-sm text-muted-foreground">{ctx.name}</p>
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
