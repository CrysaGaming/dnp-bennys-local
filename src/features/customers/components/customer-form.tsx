"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveCustomerAction, updateCustomerAction } from "../actions";
import { EMPTY_VEHICLE, VehicleFields, type VehicleFieldRow } from "./vehicle-fields";

/** Der Stand, den die Karte mitbringt – dasselbe Schema wie beim Anlegen. */
export type CustomerFormValues = {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  vehicles: Array<{ model: string; plate: string; color: string | null }>;
};

/**
 * Kunde anlegen und bearbeiten (Spec 5.6, 5.7). Ohne `customer` wird angelegt, mit
 * vorausgefüllt geändert – das Erhaltene erkennt die Fachfunktion am Kennzeichen.
 * Eine doppelte Rufnummer ist keine Ablehnung, nur ein Hinweis.
 */
export function CustomerForm({ customer, onSaved }: { customer?: CustomerFormValues; onSaved?: () => void }) {
  const router = useRouter();

  const [name, setName] = useState(customer?.name ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [notes, setNotes] = useState(customer?.notes ?? "");
  // Ein leeres Fahrzeug ist vorgegeben: fast jeder Kunde bringt eines mit.
  const [vehicles, setVehicles] = useState<VehicleFieldRow[]>(
    customer
      ? customer.vehicles.map((v) => ({ model: v.model, plate: v.plate, color: v.color ?? "" }))
      : [EMPTY_VEHICLE],
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const filled = vehicles.filter((v) => v.model.trim() !== "" || v.plate.trim() !== "");
    const payload = { name, phone, notes, vehicles: filled };

    setBusy(true);
    const res = customer ? await updateCustomerAction(customer.id, payload) : await saveCustomerAction(payload);
    setBusy(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }

    if (customer) {
      toast("Kunde aktualisiert.");
      router.refresh();
      onSaved?.();
      return;
    }

    const warnings = (res.data as { warnings?: string[] }).warnings ?? [];
    for (const warning of warnings) toast(warning);
    toast("Kunde gespeichert.");

    setName("");
    setPhone("");
    setNotes("");
    setVehicles([EMPTY_VEHICLE]);

    router.refresh();
  }

  return (
    <form className="flex flex-col gap-4" noValidate onSubmit={submit}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="customer-name">Name</Label>
        <Input id="customer-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="customer-phone">Rufnummer</Label>
        <Input id="customer-phone" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
      </div>

      <VehicleFields rows={vehicles} onChange={setVehicles} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="customer-notes">Notiz</Label>
        <Textarea id="customer-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
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
