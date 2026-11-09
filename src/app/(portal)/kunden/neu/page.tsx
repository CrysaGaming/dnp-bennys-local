import { Suspense } from "react";
import { requirePagePermission } from "@/lib/dal";
import { RouteModal } from "@/components/route-modal";
import { CustomerForm } from "@/features/customers/components/customer-form";

async function Content() {
  await requirePagePermission("CUSTOMERS_EDIT");

  return (
    <RouteModal
      title="Neuer Kunde"
      description="Rufnummer und Kennzeichen prüft die Fachfunktion auf Duplikate."
      backHref="/kunden"
      size="lg"
    >
      <CustomerForm />
    </RouteModal>
  );
}

export default function NeuerKundePage() {
  return (
    <Suspense fallback={<div>Wird geladen…</div>}>
      <Content />
    </Suspense>
  );
}
