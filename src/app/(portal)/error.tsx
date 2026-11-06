"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Freundlicher Fehlerblock mit „Erneut versuchen“ (Spec 5.4). */
export default function PortalError({ reset }: { reset: () => void }) {
  return (
    <div className="flex max-w-lg flex-col gap-3 rounded-xl border border-border bg-card/70 p-6">
      <div className="flex items-center gap-2 text-destructive">
        <AlertCircle aria-hidden className="size-5" />
        <h1 className="font-display text-xl uppercase">Da lief etwas schief</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Der Inhalt dieser Seite konnte nicht geladen werden. Probier es noch einmal – wenn es
        wieder nicht klappt, sag Benny Bescheid.
      </p>

      <Button type="button" variant="outline" onClick={reset}>
        Erneut versuchen
      </Button>
    </div>
  );
}
