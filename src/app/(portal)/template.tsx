"use client";

import { motion, useReducedMotion } from "motion/react";

/** Seitenwechsel: Fade plus 4 px Slide, 200 ms ease-out (Spec 4.3). */
export default function PortalTemplate({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: reduced ? 0 : 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
