import type { ReactNode } from "react";
import { Info } from "lucide-react";
import type { CompanySettings } from "@/features/company/service";
import type { CompanyStatus } from "@/lib/company-status";
import type { SessionContext } from "@/lib/session-types";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CompanyInfo } from "./company-info";
import { CompanyStatusBadge } from "./company-status-badge";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export type AppHeaderProps = {
  ctx: SessionContext;
  settings: CompanySettings;
  status: CompanyStatus;
  /** Rechts vor dem Theme-Toggle – Phase 3 stellt den Musik-Button hinein. */
  actions?: ReactNode;
};

/** Header (Spec 5.2): sticky, h-16, Blur und eine 1-px-Sunset-Linie unten. */
export function AppHeader({ ctx, settings, status, actions }: AppHeaderProps) {
  const info = (
    <CompanyInfo
      phone={settings.phone}
      radioChannel={settings.radioChannel}
      radioPassword={settings.radioPassword}
    />
  );

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 bg-background/70 px-4 backdrop-blur-xl sm:px-6">
      <div className="flex items-center gap-4">
        {/* Unter 768 px ist V1/V2 zu breit – dort steht immer das Emblem. */}
        <span className="md:hidden">
          <BrandLogo variant="EMBLEM" layout="compact" companyName={settings.name} />
        </span>
        <span className="hidden md:flex">
          <BrandLogo variant={settings.logoVariant} layout="compact" companyName={settings.name} />
        </span>

        <Separator orientation="vertical" className="hidden h-6 md:block" />

        <span className="hidden md:flex">{info}</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {actions}

        <span className="flex items-center gap-1">
          <CompanyStatusBadge initial={status} />
          {/* Auf dem Handy ist für Telefon und Funk kein Platz – sie ziehen ins Popover um. */}
          <span className="flex md:hidden">
            <Popover>
              <PopoverTrigger aria-label="Firmendetails öffnen" className="p-1 hover:bg-accent">
                <Info aria-hidden className="size-4" />
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72">
                <PopoverTitle>Firmendetails</PopoverTitle>
                {info}
              </PopoverContent>
            </Popover>
          </span>
        </span>

        <ThemeToggle />
        <UserMenu
          name={ctx.name}
          rankName={ctx.rank.name}
          rankColor={ctx.rank.color}
          image={ctx.image}
        />
      </div>

      <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-sunset" />
    </header>
  );
}
