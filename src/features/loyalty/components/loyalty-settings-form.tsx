"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { exampleText } from "../earn";
import { saveLoyaltySettingsAction } from "../actions";
import { StampCard } from "./stamp-card";
import { PointsBar } from "./points-bar";
import type { LoyaltySettings } from "@/generated/prisma/client";
import type { LoyaltyMode } from "@/generated/prisma/enums";

const BLOCKED_MESSAGE = "Modus kann nur gewechselt werden, solange kein Kunde Guthaben hat.";

/**
 * Treue-Einstellungen (Spec 5.10). Die Felder hängen vom Modus ab, die Vorschau zeigt die
 * Karte bzw. den Balken mit einem Beispielguthaben. Ist der Modus gesperrt, steht die
 * Begründung daneben.
 */
export function LoyaltySettingsForm({
  settings,
  blocked,
  canManage,
}: {
  settings: LoyaltySettings;
  blocked: boolean;
  canManage: boolean;
}) {
  const router = useRouter();

  const [enabled, setEnabled] = useState(settings.enabled);
  const [mode, setMode] = useState<LoyaltyMode>(settings.mode);
  const [stampsPerVisit, setStampsPerVisit] = useState(settings.stampsPerVisit);
  const [cardSize, setCardSize] = useState(settings.cardSize);
  const [dollarsPerPoint, setDollarsPerPoint] = useState(settings.dollarsPerPoint);
  const [minVisitTotal, setMinVisitTotal] = useState(settings.minVisitTotal);
  const [cooldownHours, setCooldownHours] = useState(settings.cooldownHours);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    setBusy(true);
    const res = await saveLoyaltySettingsAction({
      enabled,
      mode,
      stampsPerVisit,
      cardSize,
      dollarsPerPoint,
      minVisitTotal,
      cooldownHours,
    });
    setBusy(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }

    toast("Einstellungen gespeichert.");
    router.refresh();
  }

  const currentMode = settings.mode;

  return (
    <>
      <p className="text-sm mb-4">
        {enabled
          ? "Das Treuesystem ist an."
          : "Das Treuesystem ist aus. Kunden sammeln gerade nichts."}
      </p>

      <form className="flex flex-col gap-4" noValidate onSubmit={submit}>
        <div className="flex items-center gap-3">
          <Switch
            id="loyalty-enabled"
            checked={enabled}
            disabled={!canManage}
            onCheckedChange={(checked) => setEnabled(checked === true)}
          />
          <Label htmlFor="loyalty-enabled">Treuesystem aktiv</Label>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Modus</span>

          <RadioGroup
            value={mode}
            onValueChange={(value) => setMode(value as LoyaltyMode)}
            className="flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem id="mode-stamps" value="STAMPS" disabled={!canManage || currentMode !== "STAMPS"} aria-label="Stempel" />
              <Label htmlFor="mode-stamps">Stempel</Label>
            </div>

            <div className="flex items-center gap-2">
              <RadioGroupItem id="mode-points" value="POINTS" disabled={!canManage || currentMode !== "POINTS"} aria-label="Punkte" />
              <Label htmlFor="mode-points">Punkte</Label>
            </div>
          </RadioGroup>

          {blocked && canManage ? <p className="text-sm text-destructive">{BLOCKED_MESSAGE}</p> : null}
        </div>

        {mode === "STAMPS" ? (
          <div className="flex flex-col gap-3">
            <NumberField id="stamps-per-visit" label="Stempel pro Besuch" value={stampsPerVisit} onChange={setStampsPerVisit} disabled={!canManage} />
            <NumberField id="card-size" label="Kartengröße" value={cardSize} onChange={setCardSize} disabled={!canManage} />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <NumberField id="dollars-per-point" label="Dollar pro Punkt" value={dollarsPerPoint} onChange={setDollarsPerPoint} disabled={!canManage} />
          </div>
        )}

        <NumberField id="min-visit-total" label="Mindestbetrag pro Besuch" value={minVisitTotal} onChange={setMinVisitTotal} disabled={!canManage} />
        <NumberField id="cooldown-hours" label="Sperrzeit in Stunden" value={cooldownHours} onChange={setCooldownHours} disabled={!canManage} />

        <p className="text-sm text-muted-foreground">{exampleText(settings, 1200)}</p>

        <section className="border border-border rounded-lg p-4">
          {mode === "STAMPS" ? (
            <StampCard balance={3} cardSize={cardSize} nextReward={{ name: settings.enabled ? "Beispielprämie" : "keine Prämie", cost: cardSize }} />
          ) : (
            <PointsBar balance={6} nextReward={{ name: "Beispielprämie", cost: Math.max(1, cardSize) }} />
          )}
        </section>

        {error ? (
          <p className="text-sm text-destructive" role="alert" aria-live="polite">
            {error}
          </p>
        ) : null}

        {canManage ? (
          <Button type="submit" disabled={busy}>
            Änderungen speichern
          </Button>
        ) : null}
      </form>
    </>
  );
}

function NumberField({
  id,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="w-32"
      />
    </div>
  );
}
