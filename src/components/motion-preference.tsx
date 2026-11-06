"use client";

import { useEffect } from "react";
import { MotionConfig } from "motion/react";

/**
 * Bewegungen reduzieren (Spec 5.6 / Plan 01 Task 2.6). Die Nutzer-Vorgabe schlägt die
 * System-Vorgabe: `reducedMotion="always"` und das Attribut am <html> für die CSS-Regeln.
 */
export function MotionPreference({
  reduced,
  children,
}: {
  reduced: boolean;
  children: React.ReactNode;
}) {
  useEffect(() => {
    document.documentElement.dataset.reducedMotion = reduced ? "true" : "false";
  }, [reduced]);

  return <MotionConfig reducedMotion={reduced ? "always" : "user"}>{children}</MotionConfig>;
}
