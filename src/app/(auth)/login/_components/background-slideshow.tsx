"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { LOGIN_IMAGES } from "./images";

/** Ken Burns: Zoom 1 → 1,12, Bildwechsel alle 9 s (Spec 6.2 / 6.5). */
const ROTATE_MS = 9000;
const CROSSFADE_MS = 1200;

export function BackgroundSlideshow() {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduced) return;

    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % LOGIN_IMAGES.length);
    }, ROTATE_MS);

    return () => clearInterval(timer);
  }, [reduced]);

  const first = LOGIN_IMAGES[0];

  // Bei reduzierter Bewegung bleibt das Standbild (Spec 6.5).
  if (reduced) {
    if (!first) return null;

    return (
      <div data-slideshow data-static="true" className="login-slideshow">
        <Image src={first.src} alt={first.alt} fill priority sizes="100vw" className="object-cover" />
      </div>
    );
  }

  const image = LOGIN_IMAGES[index];
  if (!image) return null;

  return (
    <div data-slideshow className="login-slideshow">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: CROSSFADE_MS / 1000, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            priority={index === 0}
            sizes="100vw"
            className="object-cover login-ken-burns"
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
