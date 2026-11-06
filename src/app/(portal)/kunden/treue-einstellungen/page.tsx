import { Suspense } from "react";
import { requirePagePermission } from "@/lib/dal";
import { hasPermission } from "@/lib/permissions";
import { PageHeader } from "@/components/layout/page-header";
import { countCustomersWithBalance, getLoyaltySettings } from "@/features/loyalty/service";
import { LoyaltySettingsForm } from "@/features/loyalty/components/loyalty-settings-form";

async function Content() {
  // Lesen darf jeder Mitarbeiter mit Kundenrecht – schreiben nur mit LOYALTY_MANAGE (Spec 5.10).
  const ctx = await requirePagePermission("CUSTOMERS_VIEW");
  const canManage = hasPermission(ctx, "LOYALTY_MANAGE");

  const settings = await getLoyaltySettings();
  const blocked = (await countCustomersWithBalance()) > 0;

  return (
    <>
      <PageHeader
        title="Treue-Einstellungen"
        breadcrumb={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Kundenkartei", href: "/kunden" },
          { label: "Treue-Einstellungen" },
        ]}
      />

      <LoyaltySettingsForm settings={settings} blocked={blocked} canManage={canManage} />
    </>
  );
}

export default function TreueEinstellungenPage() {
  return (
    <Suspense fallback={<div>Wird geladen…</div>}>
      <Content />
    </Suspense>
  );
}
