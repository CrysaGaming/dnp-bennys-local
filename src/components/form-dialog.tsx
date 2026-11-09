"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "cn";

export type DialogSize = "sm" | "md" | "lg";

const SIZE: Record<DialogSize, string> = {
  // schmaler Dialog für Bestätigungen und kurze Formulare
  sm: "sm:max-w-md",
  // Standard: ein Anlegen-/Bearbeiten-Formular
  md: "sm:max-w-2xl",
  // viel Inhalt (z. B. Rechte-Matrix, Positionen)
  lg: "sm:max-w-4xl",
};

export type FormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  /** Eine Zeile Erklärung unter dem Titel – wirkt gegen falsche Eingaben. */
  description?: React.ReactNode;
  submitLabel: string;
  onSubmit: (e: React.FormEvent) => void;
  /** Disablet den Absende-Knopf und zeigt, dass die Action läuft. */
  busy?: boolean;
  /** Zusätzlicher Knopf links neben „Abbrechen“, z. B. „Löschen“. */
  secondary?: React.ReactNode;
  /** Der Absende-Knopf als gefährliche Aktion (z. B. „Stornieren“). */
  destructive?: boolean;
  /** Fehler der Fachfunktion – steht direkt über den Knöpfen. */
  error?: string | null;
  size?: DialogSize;
  children: React.ReactNode;
};

/**
 * Einheitliche Hülle für alle Anlegen-/Bearbeiten-Formulare (Spec 5.6, Entscheidung
 * 2026-11-08): Modal mittig, Körper scrollt, Fußzeile mit den Knöpfen bleibt unten stehen.
 * Die Fachseite liefert nur die Felder.
 */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  onSubmit,
  busy = false,
  secondary,
  destructive = false,
  error,
  size = "md",
  children,
}: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          // Der Körper scrollt, damit der Fuß mit „Abbrechen“ und Speichern nie verschwindet.
          "flex max-h-[calc(100dvh-3rem)] flex-col overflow-hidden p-0 sm:p-0",
          SIZE[size],
        )}
      >
        <DialogHeader className="gap-1 border-b px-4 pt-4 pb-3 pr-12">
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <form className="flex min-h-0 flex-1 flex-col" noValidate onSubmit={onSubmit}>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">{children}</div>

          {error ? (
            <p
              className="mx-4 mb-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground"
              role="alert"
              aria-live="polite"
            >
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-2 border-t bg-muted/50 px-4 py-3">
            {secondary}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" variant={destructive ? "destructive" : "default"} disabled={busy}>
              {submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Fehlerausgabe unter einzelnen Feldern – gleiche Stelle, gleiche Optik in jedem Dialog. */
export function FieldError({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p className="text-sm text-destructive" role="alert" aria-live="polite">
      {children}
    </p>
  );
}
