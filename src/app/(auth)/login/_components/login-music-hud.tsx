"use client";

import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { TRACK_TITLE, useMusic } from "@/components/music/music-provider";
import { useReducedMotion } from "motion/react";

const BAR_COUNT = 4;

/**
 * Musik-HUD unten links (Spec 6.3 / 6.4): Equalizer-Balken, Taste M, Slider bei Hover
 * oder Fokus, Laufschrift. Fehlt die Datei (`available === false`), wird das HUD
 * ausgeblendet. Bei reduzierter Bewegung stehen die Balken still.
 */
export function LoginMusicHUD() {
  const music = useMusic();
  const reduced = useReducedMotion();
  const [showSlider, setShowSlider] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key.toLowerCase() !== "m") return;

      music.setMuted(!music.muted);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [music]);

  if (!music.available) return null;

  return (
    <div
      className="login-hud group"
      onMouseEnter={() => setShowSlider(true)}
      onMouseLeave={() => setShowSlider(false)}
      onFocus={() => setShowSlider(true)}
      onBlur={() => setShowSlider(false)}
    >
      <div aria-hidden className={cn("login-eq", (music.muted || reduced) && "login-eq-still")}>
        {Array.from({ length: BAR_COUNT }, (_, i) => (
          <span key={i} style={{ animationDelay: `${i * 140}ms` }} />
        ))}
      </div>

      <span aria-hidden className="login-marquee">♪ {TRACK_TITLE}</span>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-pressed={music.muted}
        aria-label={music.muted ? "Musik einschalten" : "Musik stummschalten"}
        onClick={() => music.setMuted(!music.muted)}
      >
        {music.muted ? <VolumeX aria-hidden /> : <Volume2 aria-hidden />}
      </Button>

      {showSlider ? (
        <label className="login-volume flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Lautstärke</span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(music.volume * 100)}
            onChange={(event) => music.setVolume(Number(event.target.value) / 100)}
          />
        </label>
      ) : null}
    </div>
  );
}
