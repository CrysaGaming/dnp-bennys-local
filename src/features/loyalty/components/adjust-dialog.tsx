"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { adjustLoyaltyAction } from "../actions";

/** Manuelle Gutschrift (Spec 3.6) – Notiz ist Pflicht, das Konto wird nie negativ. */
export function AdjustDialog({
  customerId,
  open,
  onClose,
}: {
  customerId: string;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();

  const [amount, setAmount] = useState(1);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    setBusy(true);
    const res = await adjustLoyaltyAction({ customerId, amount, note });
    setBusy(false);

    if (!res.ok) {
      setError(res.fieldErrors?.note ?? res.error);
      return;
    }

    toast(`Guthaben jetzt ${res.data.balanceAfter}.`);
    onClose();
    router.refresh();
  }

  return (
    <Dialog open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Treue buchen</DialogTitle>
          <DialogDescription>Plus für Gutschrift, Minus für Abzug. Die Notiz bleibt stehen.</DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" noValidate onSubmit={submit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="adjust-amount">Betrag</Label>
            <Input
              id="adjust-amount"
              type="number"
              step={1}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="adjust-note">Notiz</Label>
            <Input id="adjust-note" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert" aria-live="polite">
              {error}
            </p>
          ) : null}

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={busy}>
              Buchen
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
