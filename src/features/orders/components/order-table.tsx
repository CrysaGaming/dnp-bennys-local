"use client";

import { ClipboardList } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney, formatDateTime } from "@/lib/format";
import { formatCustomerNumber } from "@/features/customers/normalize";
import type { OrderListRow } from "../order-types";

const TYPES = [
  ["REPAIR", "Reparatur"],
  ["TUNING", "Tuning"],
  ["PAINT", "Lackierung"],
  ["TOWING", "Abschleppen"],
  ["OTHER", "Sonstiges"],
] as const;

const STATUSES = [
  ["OPEN", "Offen"],
  ["IN_PROGRESS", "In Arbeit"],
  ["DONE", "Erledigt"],
  ["CANCELLED", "Storniert"],
] as const;

/** Auftragsliste (Spec 5.6). Die Filter stehen in der URL, damit ein Link Teil einer Liste ist. */
export function OrderTable({
  rows,
  filter,
  employees,
}: {
  rows: OrderListRow[];
  filter: OrderFilterView;
  employees: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();

  function apply(next: OrderFilterView) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
    }
    const query = params.toString();
    router.push(query ? `/auftraege?${query}` : "/auftraege");
  }

  return (
    <>
      <form
        className="flex flex-wrap items-end gap-3 mb-4"
        onSubmit={(e) => {
          e.preventDefault();
          apply(filter);
        }}
      >
        <div className="flex flex-col gap-1">
          <Label htmlFor="order-q">Suche</Label>
          <Input
            id="order-q"
            value={filter.q ?? ""}
            placeholder="Kunde oder Kennzeichen"
            onChange={(e) => apply({ ...filter, q: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="order-status">Status</Label>
          <Select value={filter.status ?? ""} onValueChange={(value) => value && apply({ ...filter, status: value })}>
            <SelectTrigger id="order-status" aria-label="Status">
              <SelectValue placeholder="Alle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Alle</SelectItem>
              {STATUSES.map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="order-type">Typ</Label>
          <Select value={filter.type ?? ""} onValueChange={(value) => value && apply({ ...filter, type: value })}>
            <SelectTrigger id="order-type" aria-label="Typ">
              <SelectValue placeholder="Alle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Alle</SelectItem>
              {TYPES.map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="order-employee">Mitarbeiter</Label>
          <Select value={filter.employeeId ?? ""} onValueChange={(value) => value && apply({ ...filter, employeeId: value })}>
            <SelectTrigger id="order-employee" aria-label="Mitarbeiter">
              <SelectValue placeholder="Alle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Alle</SelectItem>
              {employees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button type="submit">Filtern</Button>
      </form>

      {rows.length === 0 ? <EmptyState
          icon={ClipboardList}
          title="Keine Aufträge."
          hint="Passe die Filter an oder lege einen neuen Auftrag an."
          action={{ label: "Neuer Auftrag", href: "/auftraege/neu" }}
        /> : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nummer</TableHead>
            <TableHead>Kunde</TableHead>
            <TableHead>Fahrzeug</TableHead>
            <TableHead>Typ</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Summe</TableHead>
            <TableHead>Datum</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <Link href={`/auftraege/${row.number}`}>#{formatCustomerNumber(row.number)}</Link>
              </TableCell>
              <TableCell>
                <Link href={`/kunden/${row.customer.number}`}>{row.customer.name}</Link>
              </TableCell>
              <TableCell>{row.vehicle ? `${row.vehicle.plate} · ${row.vehicle.model}` : "–"}</TableCell>
              <TableCell>{labelOf(TYPES, row.type)}</TableCell>
              <TableCell>{labelOf(STATUSES, row.status)}</TableCell>
              <TableCell>{formatMoney(row.total)}</TableCell>
              <TableCell>{formatDateTime(row.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}

function labelOf(entries: readonly (readonly [string, string])[], value: string): string {
  return entries.find(([key]) => key === value)?.[1] ?? value;
}

type OrderFilterView = {
  status?: string;
  type?: string;
  employeeId?: string;
  q?: string;
};
