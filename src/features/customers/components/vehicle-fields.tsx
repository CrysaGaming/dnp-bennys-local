"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type VehicleFieldRow = { model: string; plate: string; color: string };

/** Fahrzeugzeilen (Spec 5.6): Modell, Kennzeichen, Farbe – höchstens zehn. */
export function VehicleFields({
  rows,
  onChange,
}: {
  rows: VehicleFieldRow[];
  onChange: (rows: VehicleFieldRow[]) => void;
}) {
  function set(index: number, key: keyof VehicleFieldRow, value: string) {
    onChange(rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium">Fahrzeuge</span>

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
              className="w-28"
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
        </div>
      ))}
    </div>
  );
}
