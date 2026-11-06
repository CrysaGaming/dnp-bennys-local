import { Suspense } from "react";
import { requirePagePermission } from "@/lib/dal";
import { hasPermission } from "@/lib/permissions";
import { PageHeader } from "@/components/layout/page-header";
import { getCustomerByNumber } from "@/features/customers/service";
import { listRewards } from "@/features/loyalty/service";
import { NewOrderForm } from "@/features/orders/components/new-order-form";

type Props = { searchParams: Promise<{ kunde?: string; praemie?: string }> };

async function Content({ searchParams }: Props) {
  const ctx = await requirePagePermission("ORDERS_CREATE");
  const params = await searchParams;

  // Kunde und Prämie sind vorbelegt, wenn der Weg über die Kundenkarte läuft (Spec 5.7).
  const canReadCustomers = hasPermission(ctx, "CUSTOMERS_VIEW");

  const customer = canReadCustomers && params.kunde ? await getCustomerByNumber(ctx, Number(params.kunde)) : null;

  const rewards = canReadCustomers ? await listRewards(ctx) : [];
  const reward = params.praemie ? rewards.find((r) => r.id === params.praemie) ?? null : null;

  return (
    <>
      <PageHeader
        title="Neuer Auftrag"
        breadcrumb={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Aufträge", href: "/auftraege" },
          { label: "Neuer Auftrag" },
        ]}
      />

      <NewOrderForm
        initialCustomer={
          customer
            ? { id: customer.id, number: customer.number, name: customer.name, plates: customer.plates }
            : null
        }
        reward={reward ? { id: reward.id, name: reward.name } : null}
      />
    </>
  );
}

export default function NeuerAuftrag({ searchParams }: Props) {
  return (
    <Suspense fallback={<div>Wird geladen…</div>}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
