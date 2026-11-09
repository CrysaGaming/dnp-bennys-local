import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export type EmptyStateProps = {
  icon?: LucideIcon;
  /** Die Zeile in Ich-Form, was fehlt – nicht „Keine Daten“. */
  title: string;
  hint?: string;
  action?: { label: string; onClick?: () => void; href?: string };
};

/**
 * Leerer Zustand einer Liste oder Tabelle. Er sagt, was fehlt, und bietet den einen
 * Weg dorthin an – deshalb hier statt in einer toast-Meldung.
 */
export function EmptyState({ icon: Icon, title, hint, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
      {Icon ? (
        <span
          aria-hidden
          className="mb-1 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground"
        >
          <Icon className="size-5" />
        </span>
      ) : null}

      <p className="font-medium">{title}</p>
      {hint ? <p className="max-w-sm text-sm text-muted-foreground">{hint}</p> : null}

      {action?.href ? (
        <Button size="sm" className="mt-2" render={<Link href={action.href} />}>
          {action.label}
        </Button>
      ) : null}
      {action && !action.href ? (
        <Button size="sm" className="mt-2" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
