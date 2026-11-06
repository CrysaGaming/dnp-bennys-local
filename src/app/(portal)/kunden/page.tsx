import { Suspense } from "react";
import { requirePagePermission } from "@/lib/dal";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { searchCustomers } from "@/features/customers/service";
import { CustomerTable } from "@/features/customers/components/customer-table";
import { hasPermission } from "@/lib/permissions";

type Props = { searchParams: Promise<{ q?: string }> };

async function Content({ searchParams }: Props) {
  const ctx = await requirePagePermission("CUSTOMERS_VIEW");
  const params = await searchParams;
  const rows = await searchCustomers(ctx, params.q ?? "");

  return (
    <>
      <PageHeader
        title="Kundenkartei"
        breadcrumb={[{ label: "Dashboard", href: "/dashboard" }, { label: "Kundenkartei" }]}
        actions={
          hasPermission(ctx, "CUSTOMERS_EDIT") ? (
            <Button variant="outline" render={<Link href="/kunden/neu" />}>
              Neuer Kunde
            </Button>
          ) : null
        }
      />

      <CustomerTable rows={rows} />
    </>
  );
}

export default function KundenPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<div>Wird geladen…</div>}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
