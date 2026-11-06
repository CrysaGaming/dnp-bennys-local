import { Suspense } from "react";
import Link from "next/link";
import { requirePagePermission } from "@/lib/dal";
import { PageHeader } from "@/components/layout/page-header";
import { getLoyaltySettings } from "@/features/loyalty/service";
import { listInvoices } from "@/features/invoices/service";
import { InvoiceTable } from "@/features/invoices/components/invoice-table";

type Props = { searchParams: Promise<{ status?: string }> };

const FILTERS = [
  ["", "Alle"],
  ["OPEN", "Offen"],
  ["PAID", "Bezahlt"],
  ["VOID", "Storniert"],
] as const;

async function Content({ searchParams }: Props) {
  const ctx = await requirePagePermission("INVOICES_MANAGE");
  const params = await searchParams;

  const rows = await listInvoices(ctx, { status: (params.status as never) ?? undefined });
  const settings = await getLoyaltySettings();

  return (
    <>
      <PageHeader
        title="Rechnungen"
        breadcrumb={[{ label: "Dashboard", href: "/dashboard" }, { label: "Rechnungen" }]}
      />

      <nav className="flex flex-wrap gap-2 mb-4" aria-label="Status filtern">
        {FILTERS.map(([value, label]) => (
          <Link
            key={value || "alle"}
            href={value ? `/rechnungen?status=${value}` : "/rechnungen"}
            className={value === (params.status ?? "") ? "font-semibold" : "underline"}
          >
            {label}
          </Link>
        ))}
      </nav>

      <InvoiceTable rows={rows} mode={settings.mode} canManage />
    </>
  );
}

export default function Rechnungen({ searchParams }: Props) {
  return (
    <Suspense fallback={<div>Wird geladen</div>}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
