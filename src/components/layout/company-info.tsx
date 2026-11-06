"use client";

import { Phone, Radio } from "lucide-react";
import { toast } from "sonner";
import { formatRadio } from "@/lib/format";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type CompanyInfoProps = {
  phone: string | null;
  radioChannel: string | null;
  radioPassword: string | null;
};

/**
 * Telefon und Funk im Header (Spec 5.2). Beides kopierbar – ohne den Clipboard-Zugriff
 * abzurstürzen, wenn der Browser ihn verweigert.
 */
export function CompanyInfo({ phone, radioChannel, radioPassword }: CompanyInfoProps) {
  const radio = formatRadio(radioChannel, radioPassword);

  async function copy(value: string) {
    try {
      await navigator.clipboard?.writeText(value);
      toast("Kopiert");
    } catch {
      toast.error("Kopieren hat nicht geklappt.");
    }
  }

  return (
    <TooltipProvider>
      <span className="flex items-center gap-3 font-mono text-sm">
        {phone ? (
          <button
            type="button"
            aria-label="Rufnummer kopieren"
            className="flex items-center gap-1.5 transition-colors hover:text-primary"
            onClick={() => copy(phone)}
          >
            <Phone aria-hidden className="size-4" />
            {phone}
          </button>
        ) : (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Phone aria-hidden className="size-4" />
            keine Rufnummer hinterlegt
          </span>
        )}

        {radio && (
          <Tooltip>
            <TooltipTrigger
              type="button"
              aria-label="Funk-Kanal kopieren"
              className="flex items-center gap-1.5 transition-colors hover:text-primary"
              onClick={() => copy(radioChannel ?? "")}
            >
              <Radio aria-hidden className="size-4" />
              {radio}
            </TooltipTrigger>
            <TooltipContent>
              Kanal {radioChannel}
              {radioPassword ? ` · Passwort ${radioPassword}` : ""}
            </TooltipContent>
          </Tooltip>
        )}
      </span>
    </TooltipProvider>
  );
}
