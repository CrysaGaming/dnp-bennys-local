import { Suspense } from "react";
import Link from "next/link";
import { requirePagePermission } from "@/lib/dal";
import { hasPermission } from "@/lib/permissions";
import { PageHeader } from "@/components/layout/page-header";
import { formatCustomerNumber } from "@/features/customers/normalize";
import { getOrderByNumber } from "@/features/orders/service";
import { listRewards } from "@/features/loyalty/service";
import { canEditOrder } from "@/features/orders/status";
import { getPriceList } from "@/features/pricelist/service";
import { OrderItems } from "@/features/orders/components/order-items";
import { OrderTotals } from "@/features/orders/components/order-totals";
import { LoyaltyPanel } from "@/features/orders/components/loyalty-panel";
import { StatusActions } from "@/features/orders/components/status-actions";

type Props = { params: Promise<{ nummer: string }> };

async function Content({ params }: Props) {
  const ctx = await requirePagePermission("ORDERS_VIEW");
  const { nummer } = await params;

  const order = await getOrderByNumber(ctx, Number(nummer));
  const canEdit = canEditOrder(ctx, order);

  const groups = (await getPriceList(ctx)).map((category) => ({
    category: category.name,
    items: category.items.map((item) => ({ id: item.id, name: item.name, price: item.price })),
  }));

  const rewards = hasPermission(ctx, "CUSTOMERS_VIEW") ? await listRewards(ctx) : [];
  const affordable = rewards.filter((reward) => reward.cost <= order.customer.loyaltyBalance);

  return (
    <>
      <PageHeader
        title={`Auftrag #${formatCustomerNumber(order.number)}`}
        breadcrumb={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Aufträge", href: "/auftraege" },
          { label: `#${formatCustomerNumber(order.number)}` },
        ]}
      />

      <p className="text-sm mb-4">
        Kunde:{" "}
        <Link href={`/kunden/${order.customer.number}`} className="underline">
          {order.customer.name}
        </Link>
        {order.vehicle ? ` · ${order.vehicle.plate} · ${order.vehicle.model}` : ""}
      </p>

      <StatusActions
        orderId={order.id}
        status={order.status}
        canEdit={canEdit}
        canInvoice={hasPermission(ctx, "INVOICES_MANAGE")}
        hasInvoice={order.invoice !== null}
      />

      <OrderItems items={order.items} groups={groups} canEdit={canEdit} orderId={order.id} />

      <OrderTotals
        subtotal={order.subtotal}
        discountPercent={order.discountPercent}
        loyaltyDiscount={order.loyaltyDiscount}
        total={order.total}
      />

      <LoyaltyPanel
        orderId={order.id}
        customerName={order.customer.name}
        balance={order.customer.loyaltyBalance}
        rewards={affordable}
        appliedReward={order.loyaltyReward}
        canEdit={canEdit}
        isOpen={order.status === "OPEN" || order.status === "IN_PROGRESS"}
      />
    </>
  );
}

export default function AuftragsDetail({ params }: Props) {
  return (
    <Suspense fallback={<div>Wird geladen…</div>}>
      <Content params={params} />
    </Suspense>
  );
}
