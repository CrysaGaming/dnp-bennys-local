"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FormDialog } from "@/components/form-dialog";
import { paidToast } from "../toast-text";
import { payInvoiceAction } from "../actions";

/** Bezahlen (Spec 5.6): Bar oder Bank, danach der Toast mit der Gutschrift. */
export function PayDialog({
  invoice,
  customerName,
  mode,
  open,
  onClose,
}: {
  invoice: { id: string; number: number };
  customerName: string;
  mode: string;
  open: boolean;
  onClose: () => void;
}) {
  const [method, setMethod] = useState<string>("CASH");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    setBusy(true);
    const res = await payInvoiceAction(invoice.id, method as "CASH" | "BANK");
    setBusy(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }

    toast(paidToast({ mode: mode as "STAMPS" | "POINTS", earned: res.data.earned, name: customerName }));
    onClose();
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={<>Rechnung #{invoice.number} bezahlen</>}
      description={<>Die Gutschrift gibt es genau einmal – pro Besuch.</>}
      submitLabel="Bezahlt"
      onSubmit={submit}
      busy={busy}
      error={error}
      size="sm"
    >
        <div className="flex flex-col gap-2">
          <Label>Zahlart</Label>
          <RadioGroup value={method} onValueChange={(value) => value && setMethod(value)}>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="CASH" id="pay-cash" />
              <Label htmlFor="pay-cash">Bar</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="BANK" id="pay-bank" />
              <Label htmlFor="pay-bank">Bank</Label>
            </div>
          </RadioGroup>
        </div>

    </FormDialog>
  );
}
