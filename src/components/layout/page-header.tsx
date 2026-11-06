import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

/**
 * Seitenkopf (Spec 5.4): Breadcrumb, Titel in Anton, Aktionen rechts. Jede Portal-Seite
 * nutzt ihn.
 */
export function PageHeader({
  title,
  breadcrumb,
  actions,
}: {
  title: string;
  breadcrumb: Array<{ label: string; href?: string }>;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-col gap-1">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          {breadcrumb.map((crumb, index) => (
            <span key={`${crumb.label}-${index}`} className="flex items-center gap-1">
              {index > 0 && <ChevronRight aria-hidden className="size-3" />}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-foreground">
                  {crumb.label}
                </Link>
              ) : (
                <span aria-current="page">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>

        <h1 className="font-display text-2xl uppercase leading-tight">{title}</h1>
      </div>

      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
