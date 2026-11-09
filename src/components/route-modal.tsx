"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DIALOG_SIZE, type DialogSize } from "@/components/form-dialog";
import { cn } from "cn";

export type RouteModalProps = {
  title: string;
  description: string;
  /** Wohin die Reise geht, wenn das Modal geschlossen wird. */
  backHref: string;
  size?: DialogSize;
  children: React.ReactNode;
};

/**
 * Formulare, die als Route angelegt sind (`/kunden/neu`, `/auftraege/neu`,
 * `/mitarbeiter/neu`), als Modal über der Liste. Die Route bleibt erhalten – geteilte
 * Links und die vorausgefüllte Kundenkarte funktionieren weiter –, aber der Weg führt
 * nicht mehr auf eine leere Seite. Schließen und Abbrechen springen zurück auf `backHref`.
 */
export function RouteModal({ title, description, backHref, size = "md", children }: RouteModalProps) {
  const router = useRouter();

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) router.push(backHref);
      }}
    >
      <DialogContent
        className={cn(
          "flex max-h-[calc(100dvh-3rem)] flex-col overflow-hidden p-0 sm:p-0",
          DIALOG_SIZE[size],
        )}
      >
        <DialogHeader className="gap-1 border-b px-4 pt-4 pb-3 pr-12">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* Der Körper scrollt – die Formulare sind lang (Fahrzeuge, Positionen, Rechte). */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
