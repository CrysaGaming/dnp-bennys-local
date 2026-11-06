"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "cn";
import { Button } from "@/components/ui/button";

/** Spec 4.3: System-Einstellung oder die Nutzer-Vorgabe aus den Settings. */
function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  if (document.documentElement.dataset.reducedMotion === "true") return true;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function viewTransitionOrigin(el: HTMLElement): { x: number; y: number } {
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

/**
 * Der Umschalter darf nichts vom aufgelösten Theme abhängig machen, was im ersten Render
 * steht: `useTheme()` kennt den Systemwert erst auf dem Client, das Server-HTML hat die
 * Vorgabe – das war die gemeldete Hydration-Differenz (Name und Icon-Klassen).
 *
 * Darum: fester Name, feste Icon-Klassen. Welches Icon steht, entscheidet CSS am html-Klassen
 * (globals.css), und das Ziel wird erst beim Klick aufgelöst.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    const { x, y } = viewTransitionOrigin(event.currentTarget);
    const current = resolvedTheme ?? "dark";
    const next = current === "dark" ? "light" : "dark";

    if (typeof document.startViewTransition !== "function" || prefersReducedMotion()) {
      setTheme(next);
      return;
    }

    document.documentElement.style.setProperty("--vt-x", `${x}px`);
    document.documentElement.style.setProperty("--vt-y", `${y}px`);
    document.startViewTransition(() => setTheme(next));
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Design wechseln"
      onClick={handleClick}
      className={cn("relative", className)}
    >
      <Sun aria-hidden className="theme-icon theme-icon--sun size-5" />
      <Moon aria-hidden className="theme-icon theme-icon--moon absolute inset-0 size-5" />
    </Button>
  );
}
