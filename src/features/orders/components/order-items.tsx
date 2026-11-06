"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMoney } from "@/lib/format";
import { addOrderItemAction, removeOrderItemAction, setOrderItemQuantityAction } from "../actions";

export type PriceGroup = { category: string; items: Array<{ id: string; name: string; price: number }> };

/** Positionen (Spec 5.6). Name und Preis sind Snapshot – später geänderte Preise ändern nicht die Rechnung. */
export function OrderItems({
  items,
  groups,
  canEdit,
  orderId,
}: {
  items: OrderDetailItems;
  groups: PriceGroup[];
  canEdit: boolean;
  orderId: string;
}) {
  const [priceItemId, setPriceItemId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!priceItemId) {
      toast("Keine Leistung gewählt.");
      return;
    }

    setBusy(true);
    const res = await addOrderItemAction(orderId, { priceListItemId: priceItemId, quantity });
    setBusy(false);

    if (!res.ok) {
      toast(res.error);
      return;
    }

    setPriceItemId("");
    setQuantity(1);
  }

  async function changeQuantity(id: string, value: number) {
    const res = await setOrderItemQuantityAction(id, value);
    if (!res.ok) toast(res.error);
  }

  async function remove(id: string) {
    const res = await removeOrderItemAction(id);
    if (!res.ok) toast(res.error);
  }

  return (
    <section className="mb-6">
      <h2 className="font-display text-xl uppercase mb-3">Positionen</h2>

      {canEdit ? (
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div className="flex flex-col gap-1 min-w-64">
            <Label htmlFor="item-price-list">Leistung</Label>
            <Select value={priceItemId} onValueChange={(value) => value && setPriceItemId(value)}>
              <SelectTrigger id="item-price-list" aria-label="Leistung">
                <SelectValue placeholder="Leistung wählen" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectGroup key={group.category}>
                    <SelectLabel>{group.category}</SelectLabel>
                    {group.items.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} · {formatMoney(item.price)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="item-quantity">Menge</Label>
            <Input
              id="item-quantity"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-24"
            />
          </div>

          <Button type="button" onClick={add} disabled={busy}>
            Hinzufügen
          </Button>
        </div>
      ) : null}

      {items.length === 0 ? <p className="text-sm text-muted-foreground">Noch keine Position.</p> : null}

      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center gap-3 border border-border rounded-lg p-3">
            <span className="flex-1">{item.description}</span>

            {canEdit ? (
              <input
                aria-label={`Menge für ${item.description}`}
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) => void changeQuantity(item.id, Number(e.target.value))}
                className="w-20 border border-border rounded-md bg-background px-2 py-1"
              />
            ) : (
              <span>{item.quantity}</span>
            )}

            <span className="font-mono">{formatMoney(item.unitPrice * item.quantity)}</span>

            {canEdit ? (
              <Button variant="outline" size="sm" onClick={() => void remove(item.id)}>
                Entfernen
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

type OrderDetailItems = Array<{
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  priceListItemId: string | null;
}>;
