"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/lib/format";
import { priceListAction, removeCategory, saveCategory, togglePriceItemActive } from "../actions";
import { PriceItemDialog } from "./price-item-dialog";
import type { PriceListView } from "../service";
import type { PartRow } from "@/features/inventory/service";

/**
 * Preisliste (Spec 5.7): Kategorien als Abschnitte, inaktive Leistungen ausgegraut.
 *
 * Diese Komponente ist die einzige, die die Liste hält. Nach jeder Aktion wird sie über
 * die Action neu geholt – sonst steht hier ein alter Wert, während der Server längst
 * revalidiert hat.
 */
export function PriceList({
  list,
  parts,
  canManage,
  includeInactive = false,
}: {
  list: PriceListView;
  parts: PartRow[] | null;
  canManage: boolean;
  includeInactive?: boolean;
}) {
  const [data, setData] = useState(list);
  const [showInactive, setShowInactive] = useState(includeInactive);
  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh(show: boolean) {
    const res = await priceListAction({ includeInactive: show });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setData(res.data as PriceListView);
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    setBusy(true);
    const res = await saveCategory({ name, sortOrder });
    setBusy(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }

    setName("");
    await refresh(showInactive);
  }

  async function toggleRow(id: string, active: boolean) {
    const res = await togglePriceItemActive(id, active);
    if (!res.ok) {
      setError(res.error);
      return;
    }

    await refresh(showInactive);
  }

  async function removeSection(id: string) {
    const res = await removeCategory(id);
    if (!res.ok) {
      setError(res.error);
      return;
    }

    await refresh(showInactive);
  }

  return (
    <>
      {canManage ? (
        <>
          <form className="flex flex-wrap items-end gap-3 mb-4" noValidate onSubmit={addCategory}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="category-name">Kategoriename</Label>
              <Input id="category-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="category-sort">Sortierung</Label>
              <Input
                id="category-sort"
                type="number"
                min={0}
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
              />
            </div>

            <Button type="submit" disabled={busy}>
              Kategorie anlegen
            </Button>
          </form>
        </>
      ) : null}

      {/* Links die Filter, rechts der Auslöser fürs Modal – wie auf den anderen Seiten. */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="show-inactive"
            checked={showInactive}
            onCheckedChange={(checked) => {
              const on = checked === true;
              setShowInactive(on);
              void refresh(on);
            }}
          />
          <Label htmlFor="show-inactive">Inaktive zeigen</Label>
        </div>

        {canManage ? <PriceItemDialog list={data} parts={parts} onSaved={() => void refresh(showInactive)} /> : null}
      </div>

      {error ? (
        <p className="text-sm text-destructive mb-4" role="alert" aria-live="polite">
          {error}
        </p>
      ) : null}

      {data.length === 0 ? <p className="text-sm text-muted-foreground">Noch keine Kategorien.</p> : null}

      {data.map((category) => (
        <section key={category.id} className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">{category.name}</h2>
            {canManage && category.items.length === 0 ? (
              <Button variant="outline" size="sm" onClick={() => void removeSection(category.id)}>
                Kategorie löschen
              </Button>
            ) : null}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Leistung</TableHead>
                <TableHead>Beschreibung</TableHead>
                <TableHead>Teil</TableHead>
                <TableHead>Preis</TableHead>
                <TableHead>Status</TableHead>
                {canManage ? <TableHead>Aktion</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {category.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canManage ? 6 : 5} className="text-muted-foreground">
                    Keine Leistungen.
                  </TableCell>
                </TableRow>
              ) : null}

              {category.items.map((item) => (
                <TableRow key={item.id} className={item.active ? "" : "text-muted-foreground"}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.description ?? "–"}</TableCell>
                  <TableCell>{item.part ? `${item.part.name} (${item.partQuantity})` : "–"}</TableCell>
                  <TableCell>{formatMoney(item.price)}</TableCell>
                  <TableCell>{item.active ? <span>–</span> : <Badge variant="secondary">inaktiv</Badge>}</TableCell>
                  {canManage ? (
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => void toggleRow(item.id, !item.active)}>
                        {item.active ? "Deaktivieren" : "Aktivieren"}
                      </Button>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      ))}
    </>
  );
}
