"use client";

import { useState } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TRACK_TITLE, useMusic } from "@/components/music/music-provider";
import { setMusicPreferenceAction } from "@/features/account/actions";

export type MusicToggleProps = {
  initial: { dashboardMusic: boolean; musicVolume: number };
};

export type MusicToggleState = "off" | "paused" | "playing";

/**
 * Musik-Button im Header (Spec 5.2 / 6.4): Klick schaltet an oder aus und speichert die
 * Wahl pro User. Bei Hover oder Fokus kommt das Popover mit dem Titel und dem Slider.
 * `data-state` ist `off`, `paused` (an, aber Autoplay blockiert) oder `playing`.
 */
export function MusicToggle({ initial }: MusicToggleProps) {
  const music = useMusic();
  const [on, setOn] = useState(initial.dashboardMusic);
  const [busy, setBusy] = useState(false);
  const [showPopover, setShowPopover] = useState(false);

  const state: MusicToggleState = !on ? "off" : music.playing ? "playing" : "paused";

  async function toggle() {
    const next = !on;
    setOn(next);
    setBusy(true);

    if (next) {
      const ok = await music.start();
      if (ok) music.setVolume(initial.musicVolume / 100);
    } else {
      music.stop();
    }

    await setMusicPreferenceAction({ dashboardMusic: next, musicVolume: initial.musicVolume });
    setBusy(false);
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        data-state={state}
        aria-label="Musik im Dashboard"
        onClick={toggle}
        disabled={busy}
        onMouseEnter={() => setShowPopover(true)}
        onMouseLeave={() => setShowPopover(false)}
        onFocus={() => setShowPopover(true)}
        onBlur={() => setShowPopover(false)}
      >
        <span aria-hidden className="flex items-end gap-0.5" data-playing={state === "playing" ? "true" : "false"}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={cn("inline-block w-0.5 h-3 bg-current", state === "playing" && "music-eq-bar")}
              style={{ animationDelay: `${i * 120}ms` }}
            />
          ))}
        </span>
      </Button>

      {showPopover ? (
        <div className="absolute right-0 top-full z-30 mt-1 w-64 rounded-lg border bg-popover p-3 text-popover-foreground">
          <p className="text-sm font-medium">{TRACK_TITLE}</p>
          <Label htmlFor="dashboard-volume" className="mt-2 block">
            Lautstärke
          </Label>
          <input
            id="dashboard-volume"
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(music.volume * 100)}
            onChange={(event) => music.setVolume(Number(event.target.value) / 100)}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            {state === "off"
              ? "Aus."
              : state === "paused"
                ? "Pausiert – die erste Aktion auf der Seite startet sie."
                : "Läuft."}
          </p>
        </div>
      ) : null}
    </div>
  );
}
