"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCustomerNumber } from "../normalize";
import { searchCustomersAction } from "../actions";
import type { CustomerRow } from "../service";

export const CUSTOMER_SEARCH_DEBOUNCE_MS = 250;

/** Kundenkartei (Spec 5.6): Nummer, Name, Rufnummer, Kennzeichen als Chips, Treuestand. */
export function CustomerTable({ rows }: { rows: CustomerRow[] }) {
  const searchRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState(rows);
  const [q, setQ] = useState("");

  async function run(term: string) {
    const res = await searchCustomersAction(term);
    if (res.ok) setData(res.data as CustomerRow[]);
  }

  useEffect(() => {
    const timer = setTimeout(() => void run(q), CUSTOMER_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [q]);

  // "/" fokussiert die Suche, aber nicht beim Tippen in einem Feld.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "/") return;

      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;

      e.preventDefault();
      searchRef.current?.focus();
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="customer-search">Suchen</Label>
          <Input
            id="customer-search"
            ref={searchRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name, Rufnummer oder Kennzeichen"
            className="w-72"
          />
        </div>

        <Button
          variant="outline"
          onClick={() => {
            setQ("");
            void run("");
          }}
        >
          Zurücksetzen
        </Button>
      </div>

      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">Keine Kunden gefunden.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nummer</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Rufnummer</TableHead>
              <TableHead>Kennzeichen</TableHead>
              <TableHead>Treuestand</TableHead>
              <TableHead>Letzter Besuch</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>
                  <Link href={`/kunden/${customer.number}`} className="font-mono">
                    {formatCustomerNumber(customer.number)}
                  </Link>
                </TableCell>
                <TableCell>{customer.name}</TableCell>
                <TableCell>{customer.phone ?? "–"}</TableCell>
                <TableCell>
                  <span className="flex flex-wrap gap-1">
                    {customer.plates.length === 0 ? (
                      <span>–</span>
                    ) : (
                      customer.plates.map((plate) => (
                        <span key={plate} className="rounded-md border border-border px-2 py-0.5 font-mono text-xs">
                          {plate}
                        </span>
                      ))
                    )}
                  </span>
                </TableCell>
                <TableCell className="font-mono">{customer.loyaltyBalance}</TableCell>
                <TableCell>
                  {customer.lastVisitAt ? new Date(customer.lastVisitAt).toLocaleDateString("de-DE") : "–"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
