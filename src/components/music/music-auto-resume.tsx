"use client";

import { useEffect } from "react";
import { onFirstInteraction } from "./first-interaction";
import { useMusic } from "./music-provider";

/**
 * Nach dem Neuladen im Dashboard (Spec 6.4): steht die Einstellung auf „an“, versucht der
 * Provider zu starten. Lehnt der Browser ab, wartet er auf die erste Nutzeraktion.
 */
export function MusicAutoResume({
  initial,
}: {
  initial: { dashboardMusic: boolean; musicVolume: number };
}) {
  const { start, setVolume } = useMusic();

  useEffect(() => {
    if (!initial.dashboardMusic) return;

    let off = () => {};

    void start().then((ok) => {
      if (ok) {
        setVolume(initial.musicVolume / 100);
        return;
      }

      off = onFirstInteraction(() => {
        void start();
      });
    });

    return () => off();
  }, [start, setVolume, initial]);

  return null;
}
