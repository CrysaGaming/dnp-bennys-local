"use client";

import { useEffect, useState } from "react";

export const COUNT_UP_MS = 800;

/**
 * Die Entscheidung fällt im Effekt, nicht im Render. Der erste Render muss auf Server und Client
 * gleich sein – sonst ist es dieselbe Hydrationsdifferenz wie beim Seitenwechsel.
 * Beides zählt: die User-Einstellung (data-reduced-motion) und die System-Vorgabe.
 */
function reducedNow(): boolean {
  if (typeof window === "undefined") return false;
  if (document.documentElement.dataset.reducedMotion === "true") return true;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}

/** Zahl, die hochzählt (Spec 5.1). Wer Bewegungen reduziert, sieht den Wert direkt. */
export function CountUp({
  value,
  format,
  durationMs = COUNT_UP_MS,
}: {
  value: number;
  format: (n: number) => string;
  durationMs?: number;
}) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (reducedNow()) {
      const tick = setTimeout(() => setShown(value), 0);
      return () => clearTimeout(tick);
    }

    const steps = Math.max(1, Math.round(durationMs / 50));
    let index = 0;

    const timer = setInterval(() => {
      index += 1;
      setShown(index >= steps ? value : Math.round((value / steps) * index));

      if (index >= steps) clearInterval(timer);
    }, 50);

    return () => clearInterval(timer);
  }, [value, durationMs]);

  return <span className="font-mono">{format(shown)}</span>;
}
