"use client";

import { cn } from "cn";
import type { LogoVariant } from "@/generated/prisma/enums";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/brand/brand-logo";

/** Karten-Reihenfolge wie in Spec 5.11. */
export const LOGO_VARIANTS: readonly LogoVariant[] = ["VICE_CITY", "LOS_SANTOS", "EMBLEM"];

const LABEL: Record<LogoVariant, string> = {
  VICE_CITY: "V2 Vice City",
  LOS_SANTOS: "V1 Los Santos",
  EMBLEM: "V3 Emblem",
};

export type LogoPickerProps = {
  /** Ausgewählte Variante – die Vorschau reagiert sofort, gespeichert wird noch nichts. */
  value: LogoVariant;
  /** Die tatsächlich gespeicherte Variante, sie trägt das Label „Aktiv“. */
  saved: LogoVariant;
  companyName: string;
  onChange: (variant: LogoVariant) => void;
  disabled: boolean;
};

/** Einfachauswahl in Karten-Form: jede Karte zeigt das Logo links dunkel, rechts hell. */
export function LogoPicker({ value, saved, companyName, onChange, disabled }: LogoPickerProps) {
  return (
    <RadioGroup
      value={value}
      onValueChange={(v) => onChange(v as LogoVariant)}
      disabled={disabled}
      className="grid gap-3 sm:grid-cols-3"
    >
      {LOGO_VARIANTS.map((variant) => (
        <label
          key={variant}
          className={cn(
            "flex cursor-pointer flex-col gap-2 rounded-xl border p-3",
            variant === value && "border-primary bg-primary/5",
            disabled && "cursor-not-allowed opacity-60",
          )}
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <RadioGroupItem
              value={variant}
              aria-label={LABEL[variant]}
              aria-disabled={disabled || undefined}
            />
            <span>{LABEL[variant]}</span>
            {variant === saved ? <Badge variant="secondary">Aktiv</Badge> : null}
          </span>

          <span className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border">
            <span className="dark flex items-center justify-center bg-card p-2">
              <BrandLogo variant={variant} layout="compact" companyName={companyName} className="h-6" />
            </span>
            <span className="light flex items-center justify-center bg-white p-2">
              <BrandLogo variant={variant} layout="compact" companyName={companyName} className="h-6" />
            </span>
          </span>
        </label>
      ))}
    </RadioGroup>
  );
}
