import { Suspense } from "react";
import { requireSession } from "@/lib/dal";
import { hasPermission } from "@/lib/permissions";
import { PageHeader } from "@/components/layout/page-header";
import { getCompanySettings } from "@/features/company/service";
import { CompanySettingsForm } from "@/features/company/components/company-settings-form";

async function Content() {
  const ctx = await requireSession();
  const settings = await getCompanySettings();

  return (
    <>
      <PageHeader
        title="Firmeneinstellungen"
        breadcrumb={[
          { label: "Verwaltung", href: "/einstellungen/firma" },
          { label: "Firmeneinstellungen" },
        ]}
      />

      {/* Ohne Recht ist der Bereich schreibgeschützt (Spec 5.11). */}
      <CompanySettingsForm settings={settings} canManage={hasPermission(ctx, "COMPANY_MANAGE")} />
    </>
  );
}

export default function FirmeneinstellungenPage() {
  return (
    <Suspense fallback={<div>Wird geladen…</div>}>
      <Content />
    </Suspense>
  );
}
