"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { editPart, savePart } from "../actions";
import type { PartRow } from "../service";

/**
 * Teil anlegen oder ändern (Spec 5.6). Der Bestand fehlt hier bewusst – er läuft nur über
 * die Buchung, damit jede Änderung eine Bewegungszeile hat.
 */
export function PartSheet({ part }: { part?: PartRow }) {
  const router = useRouter();
  const editing = Boolean(part);

  const [name, setName] = useState(part?.name ?? "");
  const [sku, setSku] = useState(part?.sku ?? "");
  const [unit, setUnit] = useState(part?.unit ?? "Stk");
  const [minStock, setMinStock] = useState(part?.minStock ?? 0);
  const [purchasePrice, setPurchasePrice] = useState(part?.purchasePrice ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    setBusy(true);
    const input = { name, sku, unit, minStock, purchasePrice };
    const res = editing ? await editPart(part!.id, input) : await savePart(input);
    setBusy(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }

    setName("");
    setSku("");
    setMinStock(0);
    setPurchasePrice(0);

    router.refresh();
  }

  return (
    <form className="flex flex-col gap-4" noValidate onSubmit={submit}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="part-name">Teilname</Label>
        <Input id="part-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="part-sku">Artikelnummer</Label>
        <Input id="part-sku" value={sku} onChange={(e) => setSku(e.target.value)} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="part-unit">Einheit</Label>
        <Input id="part-unit" value={unit} onChange={(e) => setUnit(e.target.value)} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="part-minstock">Mindestbestand</Label>
        <Input
          id="part-minstock"
          type="number"
          min={0}
          value={minStock}
          onChange={(e) => setMinStock(Number(e.target.value))}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="part-price">EK-Preis</Label>
        <Input
          id="part-price"
          type="number"
          min={0}
          value={purchasePrice}
          onChange={(e) => setPurchasePrice(Number(e.target.value))}
        />
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
