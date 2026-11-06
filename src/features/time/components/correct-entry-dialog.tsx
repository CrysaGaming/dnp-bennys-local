"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { correctEntryAction } from "../actions";
import { formatDateTime } from "@/lib/format";

/**
 * Korrektur einer Dienstzeit (Spec 5.7): nur mit TIMES_MANAGE, Notiz Pflicht,
 * Ende nach Beginn. Die Änderung wird auditiert.
 */
export function CorrectEntryDialog({
  entry,
  onClose,
}: {
  entry: { id: string; clockIn: Date; clockOut: Date | null };
  onClose: () => void;
}) {
  const [clockIn, setClockIn] = useState(toLocalInput(entry.clockIn));
  const [clockOut, setClockOut] = useState(entry.clockOut ? toLocalInput(entry.clockOut) : "");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setError(null);
    setBusy(true);

    const res = await correctEntryAction(entry.id, {
      clockIn: new Date(clockIn),
      clockOut: clockOut === "" ? null : new Date(clockOut),
      note,
    });

    setBusy(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }

    toast("Dienstzeit korrigiert.");
    onClose();
  }

  return (
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Dienstzeit korrigieren</AlertDialogTitle>
          <AlertDialogDescription>
            Geöffnet war sie am {formatDateTime(entry.clockIn)}
            {entry.clockOut ? ` bis ${formatDateTime(entry.clockOut)}` : " (läuft noch)"}.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="correct-in">Beginn</Label>
            <Input id="correct-in" type="datetime-local" value={clockIn} onChange={(e) => setClockIn(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="correct-out">Ende (leer = läuft noch)</Label>
            <Input id="correct-out" type="datetime-local" value={clockOut} onChange={(e) => setClockOut(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="correct-note">Notiz</Label>
            <Textarea id="correct-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert" aria-live="polite">
              {error}
            </p>
          ) : null}

          <div className="flex gap-2">
            <AlertDialogCancel type="button">Abbrechen</AlertDialogCancel>
            <Button type="button" disabled={busy} onClick={save}>
              Korrigieren
            </Button>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function toLocalInput(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
