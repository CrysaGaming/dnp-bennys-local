"use client";

import { useEffect, useState } from "react";
import { cn } from "cn";
import type { CompanyStatus } from "@/lib/company-status";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/** Der Status darf nicht hinter einer Cache-Lebensdauer hängen (Spec 5.10). */
export const STATUS_POLL_MS = 30_000;

/**
 * Status-Pill. Der Server liefert den ersten Wert, danach holt sich die Komponente
 * alle 30 s den aktuellen – aber nur, wenn der Tab sichtbar ist. Ein fehlgeschlagener
 * Abruf lässt den letzten bekannten Zustand stehen (Spec 3.3).
 */
export function CompanyStatusBadge({
  initial,
  poll = true,
}: {
  initial: CompanyStatus;
  poll?: boolean;
}) {
  const [status, setStatus] = useState(initial);

  useEffect(() => {
    if (!poll) return;

    const timer = setInterval(() => {
      if (document.hidden) return;

      fetch("/api/status", { cache: "no-store" })
        .then((res) => (res.ok ? (res.json() as Promise<CompanyStatus>) : null))
        .then((next) => {
          if (next) setStatus(next);
        })
        .catch(() => {
          /* letzter bekannter Zustand bleibt stehen */
        });
    }, STATUS_POLL_MS);

    return () => clearInterval(timer);
  }, [poll]);

  const title =
    status.mode === "AUTO"
      ? `Automatisch: ${status.onDutyCount} Mitarbeiter im Dienst`
      : "Manuell gesetzt";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          type="button"
          className={cn(
            "flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase",
            status.isOpen ? "text-success" : "text-destructive",
          )}
        >
          <span className="relative flex size-2 items-center justify-center" aria-hidden>
            {status.isOpen && (
              <span className="absolute inset-0 animate-ping rounded-full bg-success opacity-60" />
            )}
            <span
              className={cn("size-2 rounded-full", status.isOpen ? "bg-success" : "bg-destructive")}
            />
          </span>
          {status.isOpen ? "GEÖFFNET" : "GESCHLOSSEN"}
        </TooltipTrigger>
        <TooltipContent>{title}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
