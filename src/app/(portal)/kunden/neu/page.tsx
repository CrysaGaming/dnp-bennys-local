import { Suspense } from "react";
import { requirePagePermission } from "@/lib/dal";
import { PageHeader } from "@/components/layout/page-header";
import { CustomerForm } from "@/features/customers/components/customer-form";

async function Content() {
  await requirePagePermission("CUSTOMERS_EDIT");

  return (
    <>
      <PageHeader
        title="Neuer Kunde"
        breadcrumb={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Kundenkartei", href: "/kunden" },
          { label: "Neuer Kunde" },
        ]}
      />

      <CustomerForm />
    </>
  );
}

export default function NeuerKundePage() {
  return (
    <Suspense fallback={<div>Wird geladen…</div>}>
      <Content />
    </Suspense>
  );
}
