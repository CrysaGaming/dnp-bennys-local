"use client";

import { useState } from "react";
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
import { savePriceItem } from "../actions";
import type { PriceListView } from "../service";
import type { PartRow } from "@/features/inventory/service";

/**
 * Leistung anlegen (Spec 5.7). Das Teil ist optional – eine Leistung ohne Teil-Verknüpfung
 * ist eine reine Arbeitsleistung. Der Eltern-Component holt die Liste nach dem Speichern
 * neu, weil er sie als einziger hält.
 */
export function PriceItemSheet({
  list,
  parts,
  onSaved,
}: {
  list: PriceListView;
  parts: PartRow[] | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [categoryId, setCategoryId] = useState(list[0]?.id ?? "");
  const [partId, setPartId] = useState("");
  const [partQuantity, setPartQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    setBusy(true);
    const res = await savePriceItem({
      name,
      description: description || undefined,
      price,
      categoryId,
      partId: partId || undefined,
      partQuantity,
    });
    setBusy(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }

    setName("");
    setDescription("");

    onSaved();
  }

  return (
    <form className="flex flex-col gap-4" noValidate onSubmit={submit}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="item-name">Leistungsname</Label>
        <Input id="item-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="item-description">Beschreibung</Label>
        <Textarea id="item-description" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="item-price">Preis</Label>
        <Input
          id="item-price"
          type="number"
          min={0}
          max={10_000_000}
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="item-category">Kategorie</Label>
        <Select value={categoryId} onValueChange={(value) => value && setCategoryId(value)}>
          <SelectTrigger id="item-category" aria-label="Kategorie">
            <SelectValue placeholder="Kategorie wählen" />
          </SelectTrigger>
          <SelectContent>
            {list.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {parts ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="item-part">Teil</Label>
          <Select value={partId} onValueChange={(value) => value && setPartId(value)}>
            <SelectTrigger id="item-part" aria-label="Teil">
              <SelectValue placeholder="ohne Teil" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">ohne Teil</SelectItem>
              {parts.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex flex-col gap-2">
            <Label htmlFor="item-quantity">Teilmenge</Label>
            <Input
              id="item-quantity"
              type="number"
              min={1}
              max={100}
              value={partQuantity}
              onChange={(e) => setPartQuantity(Number(e.target.value))}
            />
          </div>
        </div>
      ) : null}

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
