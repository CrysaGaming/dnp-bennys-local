"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { rampVolume } from "./ramp";
import { readLoginMuted, writeLoginMuted } from "./login-mute-storage";

export const TRACK_TITLE = "Straßen im Blut";

const DEFAULT_SRC = "/audio/strassen-im-blut.mp3";
const START_VOLUME = 0.35;
const FADE_IN_MS = 2000;

export type MusicState = {
  available: boolean;
  playing: boolean;
  blocked: boolean;
  muted: boolean;
  volume: number;
};

export type MusicApi = MusicState & {
  start: () => Promise<boolean>;
  stop: () => void;
  setMuted: (muted: boolean) => void;
  setVolume: (volume: number) => void;
  fadeTo: (target: number, durationMs: number) => Promise<void>;
};

const MusicContext = createContext<MusicApi | null>(null);

/**
 * Das einzige `<audio>` im Baum (Spec 6.4): Das Root-Layout bleibt bei Seitenwechsel
 * erhalten, deshalb läuft der Song vom Login ins Dashboard durch.
 * `src` wird erst in `start()` gesetzt – vor dem Intro wird nichts geladen.
 * Ein abgelehntes `play()` ist der Zustand `blocked`, kein Fehler.
 */
export function MusicProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [state, setState] = useState<MusicState>({
    available: true,
    playing: false,
    blocked: false,
    muted: readLoginMuted(),
    volume: 0,
  });

  const applyVolume = useCallback((value: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const volume = Math.min(Math.max(value, 0), 1);
    audio.volume = volume;
    setState((s) => (s.volume === volume ? s : { ...s, volume }));
  }, []);

  const fadeTo = useCallback(
    (target: number, durationMs: number): Promise<void> => {
      const audio = audioRef.current;
      if (!audio) return Promise.resolve();

      const to = Math.min(Math.max(target, 0), 1);

      // Kein rAF (jsdom, ältere Browser) oder null Dauer ⇒ direkter Wert, kein Frame-Kader.
      if (durationMs <= 0 || typeof requestAnimationFrame !== "function") {
        applyVolume(to);
        return Promise.resolve();
      }

      const from = audio.volume;
      const startedAt = performance.now();

      return new Promise<void>((resolve) => {
        const tick = (now: number) => {
          const elapsed = now - startedAt;
          applyVolume(rampVolume(from, to, durationMs, elapsed));
          if (elapsed >= durationMs) {
            resolve();
            return;
          }
          requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
      });
    },
    [applyVolume],
  );

  const start = useCallback(async (): Promise<boolean> => {
    const audio = audioRef.current;
    if (!audio) return false;

    if (!audio.getAttribute("src")) {
      audio.setAttribute("src", process.env.NEXT_PUBLIC_MUSIC_SRC ?? DEFAULT_SRC);
      audio.loop = true;
    }

    if (readLoginMuted()) {
      setState((s) => ({ ...s, muted: true }));
      return false;
    }

    try {
      await audio.play();
    } catch {
      setState((s) => ({ ...s, blocked: true, playing: false }));
      return false;
    }

    setState((s) => ({ ...s, blocked: false, playing: true }));
    await fadeTo(START_VOLUME, FADE_IN_MS);
    return true;
  }, [fadeTo]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    setState((s) => ({ ...s, playing: false }));
  }, []);

  const setMuted = useCallback(
    (muted: boolean) => {
      const audio = audioRef.current;
      writeLoginMuted(muted);

      if (audio) audio.muted = muted;

      setState((s) => ({ ...s, muted }));
    },
    [],
  );

  const setVolume = useCallback((volume: number) => applyVolume(volume), [applyVolume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = readLoginMuted();

    const onError = () => setState((s) => ({ ...s, available: false }));
    audio.addEventListener("error", onError);

    return () => audio.removeEventListener("error", onError);
  }, []);

  const api = useMemo<MusicApi>(
    () => ({ ...state, start, stop, setMuted, setVolume, fadeTo }),
    [state, start, stop, setMuted, setVolume, fadeTo],
  );

  return (
    <MusicContext.Provider value={api}>
      <audio ref={audioRef} preload="auto" aria-hidden="true" />
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic(): MusicApi {
  const api = useContext(MusicContext);
  if (!api) throw new Error("useMusic braucht einen MusicProvider.");
  return api;
}
