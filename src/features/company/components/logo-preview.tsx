import { cn } from "cn";
import type { LogoVariant } from "@/generated/prisma/enums";
import { BrandLogo } from "@/components/brand/brand-logo";

export type LogoPreviewTheme = "dark" | "light";

/** Die vier Stellen, an denen das Logo auftaucht (Spec 5.11). */
const FAVICON_SIZES = [16, 32, 48] as const;

function Caption({ children }: { children: string }) {
  return <span className="text-xs uppercase tracking-wide text-muted-foreground">{children}</span>;
}

/**
 * Vorschau: sie zeigt, wie das Logo an den vier Stellen wirkt. Der Umschalter
 * unten ist nur die Vorschau – die Seite selbst bleibt in ihrer eigenen Theme-Einstellung.
 * `bg-sunset`-Verlauf ist der Fallback, wenn das Hintergrundbild fehlt.
 */
export function LogoPreview({
  variant,
  companyName,
  theme,
}: {
  variant: LogoVariant;
  companyName: string;
  theme: LogoPreviewTheme;
}) {
  return (
    <div className={cn("flex flex-col gap-3 rounded-xl border p-3", theme === "dark" ? "dark" : "light")}>
      <div className="flex flex-col gap-1">
        <Caption>Header</Caption>
        <div className="flex h-12 items-center gap-3 rounded-lg border bg-background px-3">
          <BrandLogo variant={variant} layout="compact" companyName={companyName} className="h-7" />
          <span className="ml-auto flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1">
              <span aria-hidden className="size-2 rounded-full bg-success" />
              GEÖFFNET
            </span>
            <span aria-hidden className="size-6 rounded-full border bg-muted" />
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Caption>Login</Caption>
        <div
          className="flex min-h-24 items-start rounded-lg border p-3"
          style={{
            backgroundImage:
              "linear-gradient(135deg, color-mix(in oklch, var(--background) 70%, transparent), var(--accent-violet)), url(/login/bg-01.webp)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <BrandLogo variant={variant} layout="full" companyName={companyName} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Caption>Handy</Caption>
          <div className="flex h-12 items-center gap-2 rounded-lg border bg-background px-3">
            <span aria-hidden className="size-4 rounded bg-muted" />
            <BrandLogo variant="EMBLEM" layout="compact" companyName={companyName} className="h-6" />
            <span aria-hidden className="ml-auto size-2 rounded-full bg-success" />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <Caption>Favicon (immer V3)</Caption>
          <div className="flex items-end gap-2 rounded-lg border bg-background p-3">
            {FAVICON_SIZES.map((size) => (
              <span key={size} className="flex flex-col items-center gap-1">
                <span className="flex items-center justify-center rounded" style={{ width: size, height: size }}>
                  <BrandLogo
                    variant="EMBLEM"
                    layout="compact"
                    companyName={companyName}
                    showName={false}
                    className="h-full"
                  />
                </span>
                <span className="text-[10px] text-muted-foreground">{size}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
