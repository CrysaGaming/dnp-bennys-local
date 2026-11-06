"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { profileSchema } from "../schemas";
import { updateProfileAction } from "../actions";

/**
 * Eigenes Profil (Spec 5.12): IC-Name und Telefon. Der Rang steht nur da und wird
 * nicht geändert – das wäre ein Recht für andere Mitarbeiter.
 */
export function ProfileForm({ name, phone }: { name: string; phone: string | null }) {
  const [currentName, setCurrentName] = useState(name);
  const [currentPhone, setCurrentPhone] = useState(phone ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = profileSchema.safeParse({ name: currentName, phone: currentPhone });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Bitte Eingaben prüfen.");
      return;
    }

    setBusy(true);

    const res = await updateProfileAction({ name: parsed.data.name, phone: parsed.data.phone ?? null });

    if (!res.ok) {
      setError(res.error);
      setBusy(false);
      return;
    }

    toast("Profil gespeichert.");
  }

  return (
    <form className="flex flex-col gap-4" noValidate onSubmit={submit}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">IC-Name</Label>
        <Input
          id="name"
          name="name"
          value={currentName}
          onChange={(e) => setCurrentName(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">Telefon</Label>
        <Input
          id="phone"
          name="phone"
          inputMode="tel"
          placeholder="555-0123"
          value={currentPhone}
          onChange={(e) => setCurrentPhone(e.target.value)}
        />
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert" aria-live="polite">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={busy}>
        Profil speichern
      </Button>
    </form>
  );
}
