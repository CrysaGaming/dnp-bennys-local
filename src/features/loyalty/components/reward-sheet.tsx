"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { saveRewardAction } from "../actions";

const TYPES = [
  { value: "PERCENT_DISCOUNT", label: "Prozent" },
  { value: "FIXED_DISCOUNT", label: "Fester Betrag" },
  { value: "FREE_SERVICE", label: "Gratis-Leistung" },
] as const;

/** Prämie anlegen (Spec 5.10). Eine Gratis-Leistung braucht die Leistung aus der Preisliste. */
export function RewardSheet({
  items,
  onSaved,
}: {
  items: Array<{ id: string; name: string }>;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<(typeof TYPES)[number]["value"]>("PERCENT_DISCOUNT");
  const [value, setValue] = useState(10);
  const [cost, setCost] = useState(10);
  const [priceListItemId, setPriceListItemId] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    setBusy(true);
    const res = await saveRewardAction({
      name,
      description,
      type,
      value: type === "FREE_SERVICE" ? 0 : value,
      cost,
      priceListItemId,
      sortOrder,
    });
    setBusy(false);

    if (!res.ok) {
      setError(res.fieldErrors?.priceListItemId ?? res.error);
      return;
    }

    toast("Prämie gespeichert.");
    setName("");
    setDescription("");

    onSaved();
  }

  return (
    <form className="flex flex-col gap-4" noValidate onSubmit={submit}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="reward-name">Prämienname</Label>
        <Input id="reward-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="reward-description">Beschreibung</Label>
        <Textarea id="reward-description" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="reward-type">Art</Label>
        <Select value={type} onValueChange={(value) => value && setType(value as (typeof TYPES)[number]["value"])}>
          <SelectTrigger id="reward-type" aria-label="Art">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {type === "FREE_SERVICE" ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="reward-item">Leistung</Label>
          <Select value={priceListItemId} onValueChange={(value) => value && setPriceListItemId(value)}>
            <SelectTrigger id="reward-item" aria-label="Leistung">
              <SelectValue placeholder="Leistung wählen" />
            </SelectTrigger>
            <SelectContent>
              {items.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Label htmlFor="reward-value">Wert</Label>
          <Input id="reward-value" type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="reward-cost">Kosten</Label>
        <Input id="reward-cost" type="number" min={1} value={cost} onChange={(e) => setCost(Number(e.target.value))} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="reward-sort">Sortierung</Label>
        <Input id="reward-sort" type="number" min={0} value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert" aria-live="polite">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={busy}>
        Speichern
      </Button>
    </form>
  );
}
