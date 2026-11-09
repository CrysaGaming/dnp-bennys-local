"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormDialog } from "@/components/form-dialog";
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
    <FormDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={<>Treue buchen</>}
      description={<>Plus für Gutschrift, Minus für Abzug. Die Notiz bleibt stehen.</>}
      submitLabel="Buchen"
      onSubmit={submit}
      busy={busy}
      error={error}
      size="sm"
    >
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

    </FormDialog>
  );
}
