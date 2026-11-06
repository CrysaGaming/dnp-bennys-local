"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { withImplied } from "@/lib/permissions";
import type { Permission } from "@/generated/prisma/enums";
import { createRankAction, updateRankAction } from "../actions";
import { rankSchema } from "../schemas";
import { PERMISSION_GROUPS } from "../matrix";
import { PermissionMatrix } from "./permission-matrix";
import { ColorPicker } from "./color-picker";
import type { RankRow } from "../service";

export type RankSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `null` heißt anlegen. */
  rank: RankRow | null;
  grantable: Permission[];
};

/** Rang anlegen und bearbeiten – das Sheet öffnet von rechts (Spec 5.9). */
export function RankSheet({ open, onOpenChange, rank, grantable }: RankSheetProps) {
  const [name, setName] = useState(rank?.name ?? "");
  const [level, setLevel] = useState(rank?.level ?? 10);
  const [color, setColor] = useState(rank?.color ?? "#A1A1AA");
  const [hourlyWage, setHourlyWage] = useState(rank?.hourlyWage ?? 0);
  const [permissions, setPermissions] = useState<Permission[]>(rank?.permissions ?? []);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const all = PERMISSION_GROUPS.flatMap((g) => g.permissions);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = rankSchema.safeParse({ name, level, color, hourlyWage, permissions });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Bitte Eingaben prüfen.");
      return;
    }

    setBusy(true);
    const res = rank ? await updateRankAction(rank.id, parsed.data) : await createRankAction(parsed.data);
    setBusy(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }

    toast(rank ? "Rang gespeichert." : "Rang angelegt.");
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-4 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{rank ? `Rang bearbeiten: ${rank.name}` : "Neuer Rang"}</SheetTitle>
        </SheetHeader>

        <form className="flex flex-col gap-4" noValidate onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="rank-name">Name</Label>
              <Input id="rank-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="rank-level">Level (1–99)</Label>
              <Input
                id="rank-level"
                type="number"
                min={1}
                max={99}
                value={level}
                onChange={(e) => setLevel(Number(e.target.value))}
              />
            </div>
          </div>

          <ColorPicker value={color} onChange={setColor} />

          <div className="flex flex-col gap-2">
            <Label htmlFor="rank-wage">Stundenlohn in $</Label>
            <Input
              id="rank-wage"
              type="number"
              min={0}
              max={100000}
              value={hourlyWage}
              onChange={(e) => setHourlyWage(Number(e.target.value))}
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">Vorschau</p>
            <p className="flex items-center gap-2 font-display uppercase">
              <span aria-hidden className="size-3 rounded-full" style={{ background: color }} />
              {name || "Rang"}
            </p>
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Rechte</p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setPermissions(withImplied(all))}>
                Alle wählen
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setPermissions([])}>
                Keine
              </Button>
            </div>
          </div>

          <PermissionMatrix value={permissions} onChange={setPermissions} grantable={grantable} />

          {error ? (
            <p className="text-sm text-destructive" role="alert" aria-live="polite">
              {error}
            </p>
          ) : null}

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={busy}>
              Rang speichern
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
