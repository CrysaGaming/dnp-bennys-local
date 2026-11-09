"use client";

import { ScrollText } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import type { AuditRow } from "../queries";

/** Audit-Log (Spec 5.13): Zeit, Person, Aktion, Objekt, Details. Die Details sind ausklappbar. */
export function AuditTable({ rows, nextHref }: { rows: AuditRow[]; nextHref: string | null }) {
  if (rows.length === 0) {
    return <EmptyState
            icon={ScrollText}
            title="Keine Einträge."
            hint="Hier landet jede Änderung an Rang, Bestand oder Auftrag."
          />;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Zeit</TableHead>
            <TableHead>Person</TableHead>
            <TableHead>Aktion</TableHead>
            <TableHead>Objekt</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-mono text-xs">{formatDateTime(row.createdAt)}</TableCell>
              <TableCell>{row.actorName ?? "System"}</TableCell>
              <TableCell>{row.action}</TableCell>
              <TableCell>
                {row.entity}
                {row.entityId ? ` · ${row.entityId}` : ""}
              </TableCell>
              <TableCell>
                <details>
                  <summary className="cursor-pointer text-xs">Details</summary>
                  <pre className="mt-2 text-xs whitespace-pre-wrap break-all">
                    {row.data === null || row.data === undefined ? "–" : JSON.stringify(row.data, null, 2)}
                  </pre>
                </details>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {nextHref ? (
        <Button variant="outline" render={<a href={nextHref} />} className="mt-4">
          Weitere laden
        </Button>
      ) : null}
    </>
  );
}
