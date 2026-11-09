"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormDialog } from "@/components/form-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { book } from "../actions";

const KINDS = [
  { value: "PURCHASE", label: "Zugang" },
  { value: "CORRECTION", label: "Korrektur" },
  { value: "LOSS", label: "Verlust" },
] as const;

/**
 * Buchung (Spec 5.6). Notiz ist bei Korrektur und Verlust Pflicht – die Fachfunktion
 * prüft das, hier ist es nur die Erklärung.
 */
export function BookingDialog({
  part,
  open,
  onClose,
}: {
  part: { id: string; name: string; unit: string };
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();

  const [kind, setKind] = useState<(typeof KINDS)[number]["value"]>("PURCHASE");
  const [amount, setAmount] = useState(1);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const needsNote = kind === "CORRECTION" || kind === "LOSS";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    setBusy(true);
    const res = await book({ partId: part.id, kind, amount, note: note || undefined });
    setBusy(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }

    onClose();
    router.refresh();
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={<>Buchen – {part.name}</>}
      description={<>Der Bestand ändert sich nur über diese Buchung.</>}
      submitLabel="Buchen"
      onSubmit={submit}
      busy={busy}
      error={error}
      size="sm"
    >
        <div className="flex flex-col gap-2">
          <Label htmlFor="booking-kind">Art</Label>
          <Select value={kind} onValueChange={(value) => value && setKind(value as (typeof KINDS)[number]["value"])}>
            <SelectTrigger id="booking-kind" aria-label="Art">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KINDS.map((k) => (
                <SelectItem key={k.value} value={k.value}>
                  {k.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="booking-amount">Menge</Label>
          <Input
            id="booking-amount"
            type="number"
            step={1}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">
            Korrektur auch mit Minus – die Zahl ist die Änderung in {part.unit}.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="booking-note">Notiz{needsNote ? " (Pflicht)" : ""}</Label>
          <Input id="booking-note" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

    </FormDialog>
  );
}
