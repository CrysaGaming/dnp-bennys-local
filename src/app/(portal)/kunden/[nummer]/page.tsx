import { Suspense } from "react";
import { requirePagePermission } from "@/lib/dal";
import { hasPermission } from "@/lib/permissions";
import { PageHeader } from "@/components/layout/page-header";
import { formatCustomerNumber } from "@/features/customers/normalize";
import { getCustomerByNumber } from "@/features/customers/service";
import { CustomerCard } from "@/features/customers/components/customer-card";
import { getLoyaltySettings, listRewards } from "@/features/loyalty/service";

type Props = { params: Promise<{ nummer: string }> };

async function Content({ params }: Props) {
  const ctx = await requirePagePermission("CUSTOMERS_VIEW");
  const { nummer } = await params;

  const customer = await getCustomerByNumber(ctx, Number(nummer));
  const settings = await getLoyaltySettings();
  const rewards = await listRewards(ctx);

  return (
    <>
      <PageHeader
        title={`Kunde ${formatCustomerNumber(customer.number)}`}
        breadcrumb={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Kundenkartei", href: "/kunden" },
          { label: formatCustomerNumber(customer.number) },
        ]}
      />

      <CustomerCard
        customer={customer}
        mode={settings.mode}
        cardSize={settings.cardSize}
        rewards={rewards.map((r) => ({ id: r.id, name: r.name, cost: r.cost, active: r.active }))}
        canManage={hasPermission(ctx, "LOYALTY_MANAGE")}
        canEdit={hasPermission(ctx, "CUSTOMERS_EDIT")}
      />
    </>
  );
}

export default function KundenDetailPage({ params }: Props) {
  return (
    <Suspense fallback={<div>Wird geladen…</div>}>
      <Content params={params} />
    </Suspense>
  );
}
