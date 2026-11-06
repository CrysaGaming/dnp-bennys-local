"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { searchCustomersAction } from "@/features/customers/actions";

export type PickedCustomer = { id: string; number: number; name: string; plates: string[] };

/** Suche entlastet die Action – dieselbe Verzögerung wie in der Kundenkartei. */
export const CUSTOMER_DEBOUNCE_MS = 250;

/** Kunde suchen (Spec 5.6): Name, Rufnummer oder Kennzeichen. */
export function CustomerCombobox({
  initial,
  onPick,
}: {
  initial: PickedCustomer | null;
  onPick: (customer: PickedCustomer) => void;
}) {
  const [term, setTerm] = useState(initial?.name ?? "");
  const [results, setResults] = useState<PickedCustomer[]>(initial ? [initial] : []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const res = await searchCustomersAction(term);
      if (res.ok) setResults(res.data as PickedCustomer[]);
    }, CUSTOMER_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [term]);

  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor="customer-search">Kunde</Label>
      {/* Die Ergebnisse kommen vom Server – cmdk würde sie zusätzlich nach dem
          Text filtermüssen und würde Server-Treffer wegfiltern. */}
      <Command filter={() => 1}>
        <CommandInput aria-label="Kunde" value={term} onInput={(e) => setTerm(e.currentTarget.value)} placeholder="Name, Rufnummer oder Kennzeichen" />
        <CommandList>
          <CommandGroup>
            {results.map((customer) => (
              <CommandItem key={customer.id} value={customer.id} onSelect={() => onPick(customer)}>
                {customer.name}
                {customer.plates.length > 0 ? ` · ${customer.plates.join(", ")}` : ""}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>

      <Link href="/kunden/neu" className="text-sm underline">
        Neuen Kunden anlegen
      </Link>
    </div>
  );
}
