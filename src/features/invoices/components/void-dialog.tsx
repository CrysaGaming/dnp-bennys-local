"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormDialog } from "@/components/form-dialog";
import { voidInvoiceAction } from "../actions";

/** Storno (Spec 3.6): Grund ist Pflicht, der Auftrag muss danach storniert und neu angelegt werden. */
export function VoidDialog({
  invoice,
  open,
  onClose,
}: {
  invoice: { id: string; number: number };
  open: boolean;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    setBusy(true);
    const res = await voidInvoiceAction(invoice.id, reason);
    setBusy(false);

    if (!res.ok) {
      setError(res.fieldErrors?.reason ?? res.error);
      return;
    }

    toast(`Rechnung #${invoice.number} storniert.`);
    onClose();
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={<>Rechnung #{invoice.number} stornieren</>}
      description={<>Auftrag danach stornieren und neu anlegen.</>}
      submitLabel="Stornieren"
      onSubmit={submit}
      busy={busy}
      error={error}
      size="sm"
      destructive
    >
        <div className="flex flex-col gap-1">
          <Label htmlFor="void-reason">Grund</Label>
          <Input id="void-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>

    </FormDialog>
  );
}
