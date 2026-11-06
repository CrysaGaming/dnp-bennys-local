"use client";

import { motion, useReducedMotion } from "motion/react";
import { BrandLogo } from "@/components/brand/brand-logo";
import type { LogoVariant } from "@/generated/prisma/enums";

/**
 * Logo-Slam (Spec 6.1): Scale 1.4 → 1, Blur 10 px → 0, kurzer Shake.
 * Bei reduzierter Bewegung bleibt nur der Fade (Spec 6.5).
 */
export function LogoSlam({ companyName, logoVariant }: { companyName: string; logoVariant: LogoVariant }) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className="login-logo"
      initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.4, filter: "blur(10px)" }}
      animate={
        reduced
          ? { opacity: 1 }
          : { opacity: 1, scale: 1, filter: "blur(0px)", x: [0, -6, 5, -2, 0] }
      }
      transition={{ duration: reduced ? 0.25 : 0.45, ease: "easeOut" }}
    >
      <BrandLogo variant={logoVariant} layout="full" companyName={companyName} className="h-14 login-neon" />
    </motion.div>
  );
}
