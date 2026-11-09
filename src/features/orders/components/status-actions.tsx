"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ALLOWED_TRANSITIONS } from "../status";
import { changeOrderStatusAction } from "../actions";
import { createInvoiceAction } from "@/features/invoices/actions";

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Offen",
  IN_PROGRESS: "In Arbeit",
  DONE: "Erledigt",
  CANCELLED: "Abgebrochen",
};

const ACTION_LABEL = (to: string) => (to === "CANCELLED" ? "Stornieren" : STATUS_LABEL[to]);

/** Status-Buttons nur für erlaubte Übergänge (Spec 5.6), Rechnung nur bei DONE. */
export function StatusActions({
  orderId,
  status,
  canEdit,
  canInvoice,
  hasInvoice,
}: {
  orderId: string;
  status: string;
  canEdit: boolean;
  canInvoice: boolean;
  hasInvoice: boolean;
}) {
  const [busy, setBusy] = useState(false);

  async function change(to: string) {
    setBusy(true);
    const res = await changeOrderStatusAction(orderId, to as never);
    setBusy(false);
    if (!res.ok) toast(res.error);
  }

  async function invoice() {
    setBusy(true);
    const res = await createInvoiceAction(orderId);
    setBusy(false);
    if (!res.ok) toast(res.error);
  }

  const targets = ALLOWED_TRANSITIONS[status as keyof typeof ALLOWED_TRANSITIONS] ?? [];

  return (
    <section className="mb-6">
      <h2 className="font-display text-xl uppercase mb-3">Status</h2>

      <p className="text-sm mb-3">Aktuell: {STATUS_LABEL[status] ?? status}</p>

      <div className="flex flex-wrap gap-2">
        {targets.map((to) => (
          <Button
            key={to}
            variant={to === "CANCELLED" ? "destructive" : "outline"}
            onClick={() => void change(to)}
            disabled={!canEdit || busy}
          >
            {ACTION_LABEL(to)}
          </Button>
        ))}

        {status === "DONE" && canInvoice && !hasInvoice ? (
          <Button onClick={() => void invoice()} disabled={busy}>
            Rechnung erstellen
          </Button>
        ) : null}
      </div>
    </section>
  );
}
