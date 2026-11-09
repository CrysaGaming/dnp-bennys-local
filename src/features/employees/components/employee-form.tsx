"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { createEmployeeAction, updateEmployeeAction } from "../actions";
import { StartPasswordDialog } from "./start-password-dialog";
import type { EmployeeRow } from "../service";

export type RankChoice = { id: string; name: string; level: number };

/**
 * Anlegen und Bearbeiten eines Mitarbeiters (Spec 5.6). Die Rang-Auswahl zeigt nur Ränge
 * unter dem eigenen Level – geprüft wird das in der Fachfunktion, nicht hier.
 */
export function EmployeeForm({
  employee,
  ranks,
}: {
  employee?: EmployeeRow;
  ranks: RankChoice[];
}) {
  const router = useRouter();
  const editing = Boolean(employee);

  const [name, setName] = useState(employee?.name ?? "");
  const [username, setUsername] = useState(employee?.username ?? "");
  const [rankId, setRankId] = useState(employee?.rank.id ?? ranks[0]?.id ?? "");
  const [serviceNumber, setServiceNumber] = useState(employee?.serviceNumber ?? 1);
  const [phone, setPhone] = useState(employee?.phone ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [startPassword, setStartPassword] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    setBusy(true);
    const res = editing
      ? await updateEmployeeAction(employee!.id, {
          name,
          rankId,
          serviceNumber,
          phone,
          status: employee!.status === "ON_LEAVE" ? "ON_LEAVE" : "ACTIVE",
          notes: "",
        })
      : await createEmployeeAction({ name, username, rankId, serviceNumber, phone });
    setBusy(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }

    if (!editing && res.data) {
      // Das Startpasswort zeigen nur hier, einmal (Spec 3.5).
      setStartPassword(res.data.startPassword);
    } else {
      toast("Mitarbeiter gespeichert.");
    }

    router.refresh();
  }

  return (
    <form className="flex flex-col gap-4" noValidate onSubmit={submit}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">IC-Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      {!editing ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="username">Benutzername</Label>
          <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="rank">Rang</Label>
        <Select
          value={rankId}
          items={ranks.map((rank) => ({ value: rank.id, label: `${rank.name} (Level ${rank.level})` }))}
          onValueChange={(value) => value && setRankId(value)}
        >
          <SelectTrigger id="rank" aria-label="Rang">
            <SelectValue placeholder="Rang wählen" />
          </SelectTrigger>
          <SelectContent>
            {ranks.map((rank) => (
              <SelectItem key={rank.id} value={rank.id}>
                {rank.name} (Level {rank.level})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="service-number">Dienstnummer</Label>
        <Input
          id="service-number"
          type="number"
          min={1}
          max={9999}
          value={serviceNumber}
          onChange={(e) => setServiceNumber(Number(e.target.value))}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">Telefon</Label>
        <Input id="phone" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert" aria-live="polite">
          {error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Zurück
        </Button>
        <Button type="submit" disabled={busy}>
          Speichern
        </Button>
      </div>

      {startPassword ? <StartPasswordDialog password={startPassword} onClose={() => setStartPassword(null)} /> : null}
    </form>
  );
}
