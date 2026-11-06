"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveCustomerAction } from "../actions";
import { VehicleFields, type VehicleFieldRow } from "./vehicle-fields";

/** Kunde anlegen (Spec 5.6). Eine doppelte Rufnummer ist keine Ablehnung, nur ein Hinweis. */
export function CustomerForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [vehicles, setVehicles] = useState<VehicleFieldRow[]>([
    { model: "", plate: "", color: "" },
    { model: "", plate: "", color: "" },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const filled = vehicles.filter((v) => v.model.trim() !== "" || v.plate.trim() !== "");

    setBusy(true);
    const res = await saveCustomerAction({
      name,
      phone,
      notes,
      vehicles: filled,
    });
    setBusy(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }

    for (const warning of res.data.warnings) toast(warning);

    toast(`Kunde gespeichert.`);

    setName("");
    setPhone("");
    setNotes("");
    setVehicles([
      { model: "", plate: "", color: "" },
      { model: "", plate: "", color: "" },
    ]);

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
