"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "cn";
import { formatKg, formatMoney } from "@/lib/format";
import { CATEGORY_LABEL, pricePerKg, type ResourceQuery, type ResourceSort } from "../logic";
import type { ResourceViewRow } from "./types";

const column = createColumnHelper<ResourceViewRow>();

/**
 * Tabelle (Spec 5.8). Sortiert wird mit der reinen Logik – die Tabelle zeigt die Reihe an,
 * die herausgekommen ist. Ein Wert ohne Gewicht bleibt dabei immer am Ende.
 */
export function ResourceTable({
  rows,
  query,
  canManage,
  highlightId,
  onSort,
  onEdit,
  onDelete,
}: {
  rows: ResourceViewRow[];
  query: ResourceQuery;
  canManage: boolean;
  highlightId: string | null;
  onSort: (sort: ResourceSort) => void;
  onEdit: (row: ResourceViewRow) => void;
  onDelete: (row: ResourceViewRow) => void;
}) {
  function headerFor(sort: ResourceSort, label: string) {
    const field = sort.split(".")[0];
    const active = query.sort.split(".")[0] === field;
    const dir = active ? query.sort.split(".")[1] : "asc";

    // Benannt, damit die Regel den Anzeigenamen nicht vermisst.
    function SortHeader() {
      return (
        <button type="button" onClick={() => onSort(`${field}.${dir === "asc" ? "desc" : "asc"}` as ResourceSort)}>
          {label} {active ? (dir === "asc" ? "▲" : "▼") : ""}
        </button>
      );
    }

    return SortHeader;
  }

  const columns = [
    column.accessor("name", { header: headerFor("name.asc", "Name") }),
    column.accessor("category", {
      header: headerFor("category.asc", "Kategorie"),
      cell: (info) => CATEGORY_LABEL[info.getValue()],
    }),
    column.accessor("weightGrams", {
      header: headerFor("weight.asc", "Gewicht"),
      cell: (info) => formatKg(info.getValue()),
    }),
    column.accessor("exportPrice", {
      header: headerFor("exportPrice.asc", "Export-Preis"),
      cell: (info) => formatMoney(info.getValue()),
    }),
    column.accessor((row) => pricePerKg(row.exportPrice, row.weightGrams), {
      id: "perKg",
      header: headerFor("perKg.asc", "$ / kg"),
      cell: (info) => {
        const value = info.getValue();
        return value === null ? "–" : formatMoney(value);
      },
    }),
    ...(canManage
      ? [
        column.display({
          header: "Aktion",
          cell: (info) => (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(info.row.original)}>
                Bearbeiten
              </Button>
              <Button variant="outline" size="sm" onClick={() => onDelete(info.row.original)}>
                Löschen
              </Button>
            </div>
          ),
        }),
      ]
      : []),
  ];

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {table.getHeaderGroups().flatMap((group) =>
            group.headers.map((header) => (
              <TableHead key={header.id}>
                {flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            )),
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id} className={cn(row.id === highlightId && "bg-primary/10")}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
