"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { clockInAction, clockOutAction } from "../actions";
import { formatElapsed } from "../calc";

/**
 * Stempelkarte in der Sidebar (Spec 5.7). Die laufende Zeit wird im Effect in State
 * geschrieben – `Date.now()` direkt im Render wäre ein Verstoß gegen die Regeln für
 * Komponenten (und erzeugt einen Hydrations-Unterschied zwischen Server und Browser).
 * Eingeklappt zeigt die Karte einen Punkt: grün im Dienst, grau sonst.
 */
export function ClockCard({ openSince }: { openSince: Date | null }) {
  const [elapsed, setElapsed] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!openSince) return;

    const tick = () => setElapsed(Date.now() - openSince.getTime());

    // Der erste Tick läuft sofort, aber außerhalb des Effect-Körpers – damit bleibt der
    // Effect frei von einem direkten setState und die Anzeige startet nicht bei 0.
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 1000);

    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [openSince]);

  async function toggle() {
    setBusy(true);
    const res = openSince ? await clockOutAction() : await clockInAction();
    setBusy(false);

    if (!res.ok) {
      toast(res.error);
      return;
    }

    toast(openSince ? "Ausgestempelt." : "Eingestempelt.");
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="size-2 rounded-full"
          style={{ background: openSince ? "var(--success)" : "var(--muted-foreground)" }}
        />
        <span className="font-mono tabular-nums text-sm">
          {openSince ? formatElapsed(elapsed) : "Nicht im Dienst"}
        </span>
      </div>

      <Button type="button" size="sm" disabled={busy} onClick={toggle}>
        {openSince ? "Ausstempeln" : "Einstempeln"}
      </Button>
    </div>
  );
}
