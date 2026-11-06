"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "cn";
import { RANK_COLOR_PRESETS } from "../matrix";

/** Acht Vorgabenfarben plus ein freier Hex-Wert (Spec 5.9). */
export function ColorPicker({
  value,
  onChange,
  id = "rank-color",
}: {
  value: string;
  onChange: (color: string) => void;
  id?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>Farbe</Label>

      <div className="flex flex-wrap gap-2">
        {RANK_COLOR_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            aria-label={`Farbe ${preset}`}
            onClick={() => onChange(preset)}
            className={cn("size-6 rounded-md border", preset === value && "ring-2 ring-ring")}
            style={{ background: preset }}
          />
        ))}
      </div>

      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} className="font-mono" />
    </div>
  );
}
