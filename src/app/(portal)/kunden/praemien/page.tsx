import { Suspense } from "react";
import { requirePagePermission } from "@/lib/dal";
import { hasPermission } from "@/lib/permissions";
import { PageHeader } from "@/components/layout/page-header";
import { listRewards } from "@/features/loyalty/service";
import { getPriceList } from "@/features/pricelist/service";
import { RewardTable } from "@/features/loyalty/components/reward-table";

async function Content() {
  const ctx = await requirePagePermission("CUSTOMERS_VIEW");
  const canManage = hasPermission(ctx, "LOYALTY_MANAGE");

  const rewards = await listRewards(ctx, { includeInactive: canManage });
  const items = (await getPriceList(ctx)).flatMap((category) =>
    category.items.map((item) => ({ id: item.id, name: item.name })),
  );

  return (
    <>
      <PageHeader
        title="Treueprämien"
        breadcrumb={[{ label: "Dashboard", href: "/dashboard" }, { label: "Kundenkartei", href: "/kunden" }, { label: "Treueprämien" }]}
      />

      <RewardTable rewards={rewards} items={items} canManage={canManage} />
    </>
  );
}

export default function TreuepraemienPage() {
  return (
    <Suspense fallback={<div>Wird geladen…</div>}>
      <Content />
    </Suspense>
  );
}
