"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
    <Dialog open={open} onOpenChange={(next) => (next ? null : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rechnung #{invoice.number} stornieren</DialogTitle>
          <DialogDescription>Auftrag danach stornieren und neu anlegen.</DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" noValidate onSubmit={submit}>
          <div className="flex flex-col gap-1">
            <Label htmlFor="void-reason">Grund</Label>
            <Input id="void-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert" aria-live="polite">
              {error}
            </p>
          ) : null}

          <Button type="submit" variant="destructive" disabled={busy}>
            Stornieren
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
