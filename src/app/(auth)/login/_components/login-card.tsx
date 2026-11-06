"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "cn";

/**
 * Login-Karte (Spec 6.3): Glas-Panel, kantige Felder, bei Fehlern ein kurzer Shake.
 * Bei reduzierter Bewegung nur der Fade (Spec 6.5).
 */
export function LoginCard({
  children,
  shaking,
}: {
  children: React.ReactNode;
  shaking: boolean;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={cn("login-card", shaking && !reduced && "login-card-shake")}
      initial={{ opacity: 0, y: reduced ? 0 : 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0.2 : 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
