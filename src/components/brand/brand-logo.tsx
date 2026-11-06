import { useId } from "react";
import { cn } from "cn";
import type { LogoVariant } from "@/generated/prisma/enums";
import { EMBLEM_SVG, LOGO_DATA, type LogoLayout, type LogoTheme } from "./logo-data";
import { scopeSvgIds } from "./scope-svg-ids";

/** Kompakt ca. 40 px im Header (Spec 5.2), voll auf der Login-Seite (Spec 6.2). */
const HEIGHT: Record<LogoLayout, string> = { compact: "h-10", full: "h-14" };

/**
 * Das Markenlogo (Spec 5.11). Hell und Dunkel sind dieselbe Komponente: beide
 * Markups liegen im DOM, CSS zeigt über `.dark` nur das passende. Die IDs in den
 * SVG-Definitionen werden pro Instanz und Theme gestreut, damit mehrere Logos
 * nebeneinander (Vorschau, Header, Login) sich nichts wegnehmen.
 */
export function BrandLogo({
  variant,
  layout,
  companyName,
  className,
  showName = true,
}: {
  variant: LogoVariant;
  layout: LogoLayout;
  companyName: string;
  className?: string;
  /** Fürs Favicon steht nur die Marke, ohne den Namen daneben. */
  showName?: boolean;
}) {
  const scope = useId().replace(/[^a-zA-Z0-9]/g, "");
  const markup: Record<LogoTheme, string> =
    variant === "EMBLEM" ? { dark: EMBLEM_SVG, light: EMBLEM_SVG } : LOGO_DATA[variant][layout];

  return (
    <span
      role="img"
      aria-label={companyName}
      data-logo-variant={variant}
      data-logo-layout={layout}
      className={cn(
        "inline-flex gap-2",
        layout === "compact" ? "items-center" : "flex-col items-start",
        HEIGHT[layout],
        className,
      )}
    >
      {(["dark", "light"] as const).map((theme) => (
        <span
          key={theme}
          data-logo-theme={theme}
          className={cn(
            "flex h-full items-center [&>svg]:block [&>svg]:h-full [&>svg]:w-auto",
            theme === "dark" ? "hidden dark:flex" : "flex dark:hidden",
          )}
          dangerouslySetInnerHTML={{ __html: scopeSvgIds(markup[theme], `${scope}-${theme}`) }}
        />
      ))}

      {variant === "EMBLEM" && showName && (
        <span className="font-display text-lg uppercase leading-none">{companyName}</span>
      )}
    </span>
  );
}
