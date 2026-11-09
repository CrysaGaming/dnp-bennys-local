"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDelta, reasonLabel } from "../format";
import { listMovementsAction } from "../actions";
import type { MovementRow } from "../movement-types";

/** Bewegungshistorie eines Teils (Spec 5.6) – die letzten 100 Bewegungen. */
export function MovementsDialog({
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
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-3rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Historie – {part.name}</DialogTitle>
          <DialogDescription>Letzte Bewegungen, neueste zuerst.</DialogDescription>
        </DialogHeader>

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
      </DialogContent>
    </Dialog>
  );
}
