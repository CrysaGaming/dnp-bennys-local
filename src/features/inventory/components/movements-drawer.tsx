"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatDelta, reasonLabel } from "../format";
import { listMovementsAction } from "../actions";
import type { MovementRow } from "../movement-types";

/** Bewegungshistorie eines Teils (Spec 5.6) – die letzten 100 Bewegungen. */
export function MovementsDrawer({
  part,
  open,
  onClose,
}: {
  part: { id: string; name: string; unit: string };
  open: boolean;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<MovementRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    listMovementsAction(part.id).then((res) => {
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setRows(res.data);
    });
  }, [open, part.id]);

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Historie – {part.name}</SheetTitle>
          <SheetDescription>Letzte Bewegungen, neueste zuerst.</SheetDescription>
        </SheetHeader>

        {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}

        <ul className="flex flex-col gap-2">
          {(rows ?? []).map((m) => (
            <li key={m.id} className="text-sm">
              <span>{formatDelta(m.delta, part.unit)} {reasonLabel(m.reason)}</span>
              <span className="block text-xs text-muted-foreground">
                {new Date(m.at).toLocaleString("de-DE")}
                {m.note ? ` · ${m.note}` : ""}
              </span>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
