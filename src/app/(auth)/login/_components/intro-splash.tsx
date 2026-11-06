"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { BrandLogo } from "@/components/brand/brand-logo";
import type { LogoVariant } from "@/generated/prisma/enums";
import { LOGIN_INTRO } from "./images";

/**
 * Intro-Splash (Spec 6.1): schwarz, vollflächig, Logo als dunkle Silhouette,
 * darunter der pulsierende Hinweis. Diese Aktion ist Pflicht, weil Browser Musik
 * ohne Nutzeraktion blockieren.
 */
export function IntroSplash({
  companyName,
  logoVariant,
  onStart,
}: {
  companyName: string;
  logoVariant: LogoVariant;
  onStart: () => void;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className="login-intro"
      onClick={onStart}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0.01 : 0.25 }}
    >
      <Image src={LOGIN_INTRO.src} alt="" fill priority sizes="100vw" className="object-cover" />
      <div className="login-intro-shade" />

      <div className="relative flex flex-col items-center gap-6 px-6 text-center">
        <BrandLogo variant={logoVariant} layout="full" companyName={companyName} className="h-14 login-silhouette" />
        {/* Der Text steht bewusst in Großbuchstaben im DOM – `getByText` findet sonst nichts. */}
        <p className="login-pulse text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          DRÜCKE EINE TASTE ODER KLICKE
        </p>
      </div>
    </motion.div>
  );
}
