"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type VehicleFieldRow = { model: string; plate: string; color: string };

export const EMPTY_VEHICLE: VehicleFieldRow = { model: "", plate: "", color: "" };

const MAX_VEHICLES = 10;

export type VehicleFieldsProps = {
  rows: VehicleFieldRow[];
  onChange: (rows: VehicleFieldRow[]) => void;
  /** Bearbeiten zeigt die vorhandenen Fahrzeuge; der Kopf nennt dann die Zahl. */
  heading?: string;
};

/**
 * Fahrzeugzeilen (Spec 5.6): Modell, Kennzeichen, Farbe – beliebig viele bis zehn,
 * weil ein Kunde mehrere Wagen haben kann. Neue Zeile per Knopf, leere Zeilen
 * überspringt die Fachfunktion.
 */
export function VehicleFields({ rows, onChange, heading = "Fahrzeuge" }: VehicleFieldsProps) {
  function set(index: number, key: keyof VehicleFieldRow, value: string) {
    onChange(rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  }

  function add() {
    onChange([...rows, EMPTY_VEHICLE]);
  }

  function remove(index: number) {
    const next = rows.filter((_, i) => i !== index);
    onChange(next.length > 0 ? next : [EMPTY_VEHICLE]);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{heading}</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {rows.filter((r) => r.model.trim() || r.plate.trim()).length}/{MAX_VEHICLES}
        </span>
      </div>

      {rows.map((row, index) => (
        <div key={index} className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor={`vehicle-model-${index}`}>Modell</Label>
            <Input
              id={`vehicle-model-${index}`}
              value={row.model}
              onChange={(e) => set(index, "model", e.target.value)}
              className="w-40"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor={`vehicle-plate-${index}`}>Kennzeichen</Label>
            <Input
              id={`vehicle-plate-${index}`}
              value={row.plate}
              onChange={(e) => set(index, "plate", e.target.value)}
              className="w-28 font-mono"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor={`vehicle-color-${index}`}>Farbe</Label>
            <Input
              id={`vehicle-color-${index}`}
              value={row.color}
              onChange={(e) => set(index, "color", e.target.value)}
              className="w-24"
            />
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Fahrzeug ${index + 1} entfernen`}
            onClick={() => remove(index)}
          >
            <Trash2 aria-hidden />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={add}
        disabled={rows.length >= MAX_VEHICLES}
        className="self-start"
      >
        + Fahrzeug hinzufügen
      </Button>
    </div>
  );
}
