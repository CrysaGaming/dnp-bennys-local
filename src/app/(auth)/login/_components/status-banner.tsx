"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "cn";
import type { SceneBanner } from "./login-scene-machine";

/**
 * Status-Banner im Stil der GTA-Status-Banner (Spec 6.1). Nur Deko, darum `aria-hidden` –
 * der Klartext steht im Formular unter `aria-live`.
 */
export function StatusBanner({ banner, name }: { banner: SceneBanner; name: string | null }) {
  const reduced = useReducedMotion();

  if (!banner) return null;

  const denied = banner === "denied";

  return (
    <motion.div
      aria-hidden
      className={cn("login-banner", denied ? "login-banner-denied" : "login-banner-welcome")}
      initial={{ opacity: 0, x: reduced ? 0 : -40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: reduced ? 0.2 : 0.3, ease: "easeOut" }}
    >
      <span className="font-display uppercase tracking-[0.18em]">
        {denied ? "ZUGRIFF VERWEIGERT" : "WILLKOMMEN ZURÜCK"}
      </span>
      {!denied && name ? <span className="login-banner-name">{name}</span> : null}
    </motion.div>
  );
}
