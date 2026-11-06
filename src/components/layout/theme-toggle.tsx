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

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const current = resolvedTheme ?? theme ?? "dark";
  const next = current === "dark" ? "light" : "dark";

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    const { x, y } = viewTransitionOrigin(event.currentTarget);

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
      aria-label={`Zu ${next === "light" ? "hellem" : "dunklem"} Design wechseln`}
      onClick={handleClick}
      className={cn("relative", className)}
    >
      <Sun
        aria-hidden
        className={cn(
          "size-5 transition-transform duration-300",
          next === "light" ? "scale-100 rotate-0" : "scale-0 -rotate-90",
        )}
      />
      <Moon
        aria-hidden
        className={cn(
          "absolute inset-0 size-5 transition-transform duration-300",
          next === "light" ? "scale-0 rotate-90" : "scale-100 rotate-0",
        )}
      />
    </Button>
  );
}
