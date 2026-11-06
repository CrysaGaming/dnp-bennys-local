"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

/** Die Palmen-Parallaxe folgt der Maus um höchstens 12 px (Spec 6.2). */
const MAX_SHIFT = 12;

function Palm({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round">
      <path d="M40 96 C 38 74 36 60 32 48" />
      <path d="M32 48 C 22 42 12 42 4 46" />
      <path d="M32 48 C 24 38 14 34 4 34" />
      <path d="M32 48 C 34 36 40 28 50 24" />
      <path d="M32 48 C 42 40 52 38 60 40" />
      <path d="M32 48 C 30 38 26 30 20 24" />
    </g>
  );
}

/** Ebene 3 (Spec 6.2): Farbe, Palmen, Scheinwerfer, Grain, Vignette, Scanlines. */
export function SceneOverlays() {
  const reduced = useReducedMotion();
  const [shift, setShift] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (reduced) return;

    function onMove(event: PointerEvent) {
      const x = (event.clientX / window.innerWidth - 0.5) * 2 * MAX_SHIFT;
      const y = (event.clientY / window.innerHeight - 0.5) * 2 * MAX_SHIFT;
      setShift({ x, y });
    }

    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduced]);

  return (
    <>
      <div aria-hidden className="login-gradient" />

      <motion.div
        aria-hidden
        className="login-palms"
        style={{ transform: `translate3d(${shift.x}px, ${shift.y}px, 0)` }}
      >
        <svg viewBox="0 0 260 100" className="h-full w-auto">
          <Palm x={20} y={0} />
          <Palm x={150} y={10} />
        </svg>
      </motion.div>

      <div aria-hidden className="login-streak" />
      <div aria-hidden className="login-grain" />
      <div aria-hidden className="login-vignette" />
      <div aria-hidden className="login-scanlines" />
    </>
  );
}
