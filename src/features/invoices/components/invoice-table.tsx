"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/lib/format";
import { PayDialog } from "./pay-dialog";
import { VoidDialog } from "./void-dialog";
import type { InvoiceRowData } from "../invoice-types";

/** Rechnungsliste (Spec 5.6). Der Statusfilter steht in der URL. */
export function InvoiceTable({
  rows,
  mode,
  canManage,
}: {
  rows: InvoiceRowData[];
  mode: string;
  canManage: boolean;
}) {
  const [paying, setPaying] = useState<InvoiceRowData | null>(null);
  const [voiding, setVoiding] = useState<InvoiceRowData | null>(null);

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Noch keine Rechnungen.</p>;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nummer</TableHead>
            <TableHead>Auftrag</TableHead>
            <TableHead>Kunde</TableHead>
            <TableHead>Betrag</TableHead>
            <TableHead>Status</TableHead>
            {canManage ? <TableHead>Aktionen</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>#{row.number}</TableCell>
              <TableCell>
                {row.order ? (
                  <Link href={`/auftraege/${row.order.number}`}>#{row.order.number}</Link>
                ) : (
                  "–"
                )}
              </TableCell>
              <TableCell>{row.order?.customer.name ?? "–"}</TableCell>
              <TableCell>{formatMoney(row.amount)}</TableCell>
              <TableCell>{statusLabel(row.status)}</TableCell>
              {canManage ? (
                <TableCell>
                  <div className="flex gap-2">
                    {row.status === "OPEN" ? (
                      <Button size="sm" onClick={() => setPaying(row)}>
                        Bezahlt markieren
                      </Button>
                    ) : null}
                    {row.status !== "VOID" ? (
                      <Button size="sm" variant="outline" onClick={() => setVoiding(row)}>
                        Storno
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {paying ? (
        <PayDialog
          invoice={paying}
          customerName={paying.order?.customer.name ?? ""}
          mode={mode}
          open
          onClose={() => setPaying(null)}
        />
      ) : null}

      {voiding ? <VoidDialog invoice={voiding} open onClose={() => setVoiding(null)} /> : null}
    </>
  );
}

function statusLabel(status: string): string {
  if (status === "PAID") return "Bezahlt";
  if (status === "VOID") return "Storniert";
  return "Offen";
}
