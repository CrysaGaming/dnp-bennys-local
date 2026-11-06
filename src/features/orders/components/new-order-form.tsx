"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createOrderAction, applyRewardAction } from "../actions";
import { customerByNumberAction } from "@/features/customers/actions";
import { CustomerCombobox, type PickedCustomer } from "./customer-combobox";

const TYPES = [
  ["REPAIR", "Reparatur"],
  ["TUNING", "Tuning"],
  ["PAINT", "Lackierung"],
  ["TOWING", "Abschleppen"],
  ["OTHER", "Sonstiges"],
] as const;

/** Neuer Auftrag (Spec 5.6). Kunde und Prämie können vorbelegt sein. */
export function NewOrderForm({
  initialCustomer,
  reward,
}: {
  initialCustomer: PickedCustomer | null;
  reward: { id: string; name: string } | null;
}) {
  const router = useRouter();

  const [customer, setCustomer] = useState<PickedCustomer | null>(initialCustomer);
  const [vehicles, setVehicles] = useState<Array<{ id: string; plate: string }>>([]);
  const [type, setType] = useState<string>("REPAIR");
  const [vehicleId, setVehicleId] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function pick(picked: PickedCustomer) {
    setCustomer(picked);
    setVehicleId("");

    const res = await customerByNumberAction(picked.number);
    if (!res.ok) return;

    const detail = res.data as { vehicles: Array<{ id: string; plate: string }> };
    setVehicles(detail.vehicles);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!customer) {
      toast("Kein Kunde gewählt.");
      return;
    }

    setBusy(true);
    const res = await createOrderAction({
      type,
      customerId: customer.id,
      vehicleId: vehicleId || null,
      notes: notes || null,
    });

    if (!res.ok) {
      setBusy(false);
      toast(res.error);
      return;
    }

    if (reward) {
      const applied = await applyRewardAction(res.data.id, reward.id);
      if (!applied.ok) toast(applied.error);
    }

    setBusy(false);
    router.push(`/auftraege/${res.data.number}`);
  }

  return (
    <form className="flex flex-col gap-4 max-w-xl" noValidate onSubmit={submit}>
      <CustomerCombobox initial={customer} onPick={pick} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="order-type">Typ</Label>
        <Select value={type} onValueChange={(value) => value && setType(value)}>
          <SelectTrigger id="order-type" aria-label="Typ">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPES.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="order-vehicle">Fahrzeug</Label>
        <Select value={vehicleId} onValueChange={(value) => value && setVehicleId(value)}>
          <SelectTrigger id="order-vehicle" aria-label="Fahrzeug">
            <SelectValue placeholder="Kein Fahrzeug" />
          </SelectTrigger>
          <SelectContent>
            {vehicles.map((vehicle) => (
              <SelectItem key={vehicle.id} value={vehicle.id}>
                {vehicle.plate}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {reward ? (
        <p className="text-sm">
          Prämie: <strong>{reward.name}</strong> – wird nach dem Anlegen eingelöst.
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="order-notes">Notiz</Label>
        <Textarea id="order-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <Button type="submit" disabled={busy}>
        Auftrag anlegen
      </Button>
    </form>
  );
}
