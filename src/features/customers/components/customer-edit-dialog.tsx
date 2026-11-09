"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CustomerForm } from "./customer-form";
import type { CustomerDetail } from "../service";

/**
 * Kunde bearbeiten (Spec 5.7) – dasselbe Formular wie beim Anlegen, vorausgefüllt.
 * Fahrzeuge stehen schon da und lassen sich mit „+ Fahrzeug hinzufügen" ergänzen oder
 * über das Papierkorb-Symbol entfernen; die Fachfunktion hält daran das Kennzeichen als
 * Erkennungsmerkmal.
 */
export function CustomerEditDialog({ customer }: { customer: CustomerDetail }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Bearbeiten
      </Button>

      {open ? (
        <Dialog
          open
          onOpenChange={(next) => {
            if (!next) setOpen(false);
          }}
        >
          <DialogContent className="max-h-[calc(100dvh-3rem)] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Kunde bearbeiten</DialogTitle>
              <DialogDescription>
                Was kein Kennzeichen mehr hat, verliert den Kunden – Aufträge an dem Fahrzeug bleiben erhalten.
              </DialogDescription>
            </DialogHeader>

            <CustomerForm
              customer={{
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
                notes: customer.notes,
                vehicles: customer.vehicles,
              }}
              onSaved={() => setOpen(false)}
            />
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
