"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { cn } from "cn";

/** Ladetipps (Spec 6.3). */
export const LOADING_TIPS: string[] = [
  "Stempel dich ein, bevor du Aufträge annimmst.",
  "Teile unter Mindestbestand siehst du rot im Lager.",
  "Rechnungen erst nach Bezahlung als bezahlt markieren.",
];

/** Zyklischer Index – am Ende wieder von vorn. */
export function nextTipIndex(index: number, length: number): number {
  if (length <= 0) return 0;

  return (index + 1) % length;
}

/** Der rotierende Text im HUD rechts (Spec 6.2), alle 6 s. */
const ROTATE_MS = 6000;

export function LoadingTips({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => nextTipIndex(i, LOADING_TIPS.length));
    }, ROTATE_MS);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
      <span aria-hidden className="login-spinner" />
      <motion.span key={index} className="login-tip">
        {LOADING_TIPS[index]}
      </motion.span>
    </div>
  );
}
