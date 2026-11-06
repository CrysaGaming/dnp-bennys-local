"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime, formatDuration } from "@/lib/format";
import { entryMinutes } from "../calc";
import { CorrectEntryDialog } from "./correct-entry-dialog";
import type { TimeEntry } from "@/generated/prisma/client";

/** Zeiten einer Woche (Spec 5.7). Der Knopf zur Korrektur ist nur mit TIMES_MANAGE da. */
export function TimeTable({
  entries,
  canCorrect,
}: {
  entries: TimeEntry[];
  canCorrect: boolean;
}) {
  const [selected, setSelected] = useState<TimeEntry | null>(null);
  const now = new Date();

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Beginn</TableHead>
            <TableHead>Ende</TableHead>
            <TableHead>Dauer</TableHead>
            <TableHead>Notiz</TableHead>
            {canCorrect ? <TableHead>Korrektur</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="font-mono tabular-nums">{formatDateTime(entry.clockIn)}</TableCell>
              <TableCell className="font-mono tabular-nums">
                {entry.clockOut ? formatDateTime(entry.clockOut) : "läuft"}
              </TableCell>
              <TableCell className="font-mono tabular-nums">{formatDuration(entryMinutes(entry, now))}</TableCell>
              <TableCell>
                {entry.note ?? (entry.editedById ? <span className="text-muted-foreground">korrigiert</span> : "")}
              </TableCell>
              {canCorrect ? (
                <TableCell>
                  <Button type="button" size="sm" variant="outline" onClick={() => setSelected(entry)}>
                    Korrigieren
                  </Button>
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selected ? <CorrectEntryDialog entry={selected} onClose={() => setSelected(null)} /> : null}
    </>
  );
}
