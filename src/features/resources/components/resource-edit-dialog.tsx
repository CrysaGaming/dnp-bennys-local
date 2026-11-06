"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { updateResourceAction } from "../actions";
import { CATEGORY_LABEL, CATEGORY_ORDER } from "../logic";
import type { ResourceViewRow } from "./types";
import type { ResourceCategory } from "@/generated/prisma/enums";

/** Bearbeiten einer Ressource – dieselbe Eingabe wie oben, nur vorausgefüllt. */
export function ResourceEditDialog({
  row,
  open,
  onClose,
}: {
  row: ResourceViewRow;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();

  const [name, setName] = useState(row.name);
  const [weight, setWeight] = useState(String(row.weightGrams / 1000));
  const [price, setPrice] = useState(String(row.exportPrice));
  const [category, setCategory] = useState<ResourceCategory>(row.category);
  const [note, setNote] = useState(row.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    setBusy(true);
    const res = await updateResourceAction(row.id, {
      name,
      weight,
      exportPrice: price,
      category,
      note: note || undefined,
    });
    setBusy(false);

    if (!res.ok) {
      setError(res.fieldErrors?.name ?? res.error);
      return;
    }

    toast(`${row.name} geändert.`);
    onClose();
    router.refresh();
  }

  return (
    <Dialog open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ressource bearbeiten</DialogTitle>
          <DialogDescription>Der Name bleibt in der Liste der einzige.</DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" noValidate onSubmit={submit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-weight">Gewicht (kg)</Label>
            <Input id="edit-weight" value={weight} onChange={(e) => setWeight(e.target.value)} inputMode="decimal" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-price">Export-Preis ($)</Label>
            <Input id="edit-price" value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-category">Kategorie</Label>
            <Select value={category} onValueChange={(value) => value && setCategory(value as ResourceCategory)}>
              <SelectTrigger id="edit-category" aria-label="Kategorie">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_ORDER.map((c) => (
                  <SelectItem key={c} value={c}>
                    {CATEGORY_LABEL[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-note">Notiz</Label>
            <Textarea id="edit-note" value={note} onChange={(e) => setNote(e.target.value)} />
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
              Speichern
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
