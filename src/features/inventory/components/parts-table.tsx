"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import { BookingDialog } from "./booking-dialog";
import { MovementsDrawer } from "./movements-drawer";
import type { PartRow } from "../service";

/**
 * Lagerliste (Spec 5.6). Ein knapper Teil ist rot markiert. Ohne INVENTORY_MANAGE gibt es
 * keine Knöpfe zum Buchen – die Fachfunktion prüft das Recht trotzdem.
 */
export function PartsTable({ parts, canManage }: { parts: PartRow[]; canManage: boolean }) {
  const [booking, setBooking] = useState<PartRow | null>(null);
  const [history, setHistory] = useState<PartRow | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Artikelnummer</TableHead>
            <TableHead>Bestand</TableHead>
            <TableHead>Mindestbestand</TableHead>
            <TableHead>EK-Preis</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Aktion</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {parts.map((part) => (
            <TableRow key={part.id} className={part.isLow ? "bg-destructive/10 text-destructive" : ""}>
              <TableCell>{part.name}</TableCell>
              <TableCell>{part.sku ?? "–"}</TableCell>
              <TableCell>{part.stock}</TableCell>
              <TableCell>{part.minStock}</TableCell>
              <TableCell>{formatMoney(part.purchasePrice)}</TableCell>
              <TableCell>
                {part.isLow ? <Badge variant="destructive">knapp</Badge> : <span>–</span>}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {canManage ? (
                    <Button variant="outline" size="sm" onClick={() => setBooking(part)}>
                      Buchen
                    </Button>
                  ) : null}
                  <Button variant="outline" size="sm" onClick={() => setHistory(part)}>
                    Historie
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {booking ? (
        <BookingDialog
          part={booking}
          open
          onClose={() => setBooking(null)}
        />
      ) : null}

      {history ? (
        <MovementsDrawer part={history} open onClose={() => setHistory(null)} />
      ) : null}
    </>
  );
}
