"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
import { AnimatePresence, useReducedMotion } from "motion/react";
import { cn } from "cn";
import { authClient } from "@/lib/auth-client";
import type { LogoVariant } from "@/generated/prisma/enums";
import { useMusic } from "@/components/music/music-provider";
import { musicAfterLogin } from "@/components/music/music-after-login";
import { getMusicPreferenceAction } from "@/features/account/actions";
import { LoginForm } from "./login-form";
import { IntroSplash } from "./intro-splash";
import { BackgroundSlideshow } from "./background-slideshow";
import { SceneOverlays } from "./scene-overlays";
import { LogoSlam } from "./logo-slam";
import { LoginCard } from "./login-card";
import { StatusBanner } from "./status-banner";
import { LoadingTips } from "./loading-tips";
import { LoginShade } from "./login-shade";
import { LoginMusicHUD } from "./login-music-hud";
import { loginSceneReducer } from "./login-scene-machine";

const FLASH_MS = 120;
const BANNER_MS = 1800;
const FADE_OUT_MS = 800;

/**
 * Login-Szene (Spec 6.1–6.3). Der Automat entscheidet, was steht; die Komponenten
 * zeigen es. Musik startet erst durch diese Nutzeraktion, ein abgelehntes `play()`
 * ist der Zustand `blocked`. Das Navigieren nach Erfolg bleibt im Formular (Logik aus
 * Task 1.4, inklusive Startroute für den erzwungenen Passwortwechsel).
 */
export function LoginScene({
  companyName,
  logoVariant,
  notice,
}: {
  companyName: string;
  logoVariant: LogoVariant;
  /** Grund, warum es trotz Session nicht weitergeht (Spec 3.2). */
  notice?: string | null;
}) {
  const [state, dispatch] = useReducer(loginSceneReducer, { phase: "intro", banner: null });
  const music = useMusic();
  const reduced = useReducedMotion();
  const [flash, setFlash] = useState(false);
  const [name, setName] = useState<string | null>(null);

  const start = useCallback(() => {
    if (state.phase !== "intro") return;

    dispatch({ type: "START" });
    setFlash(true);
    setTimeout(() => setFlash(false), reduced ? 0 : FLASH_MS);

    void music.start();
  }, [state.phase, music, reduced]);

  useEffect(() => {
    if (state.phase !== "intro") return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey) return;
      start();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [state.phase, start]);

  // „ZUGRIFF VERWEIGERT“ bleibt 1,8 s stehen, dann folgt BANNER_DONE (Spec 6.1).
  useEffect(() => {
    if (state.banner !== "denied") return;

    const timer = setTimeout(() => dispatch({ type: "BANNER_DONE" }), BANNER_MS);
    return () => clearTimeout(timer);
  }, [state.banner]);

  // Der Name steht erst nach dem Login fest – fürs Willkommensbanner.
  useEffect(() => {
    if (state.phase !== "success") return;

    authClient
      .getSession()
      .then((res) => setName(res?.data?.user?.name ?? null))
      .catch(() => setName(null));
  }, [state.phase]);

  async function onResult(result: "success" | "error") {
    if (result === "error") {
      dispatch({ type: "LOGIN_ERROR" });
      return;
    }

    dispatch({ type: "LOGIN_SUCCESS" });

    // Spec 6.4: hat der User Dashboard-Musik an, läuft der Song weiter, sonst Fade-out.
    const res = await getMusicPreferenceAction();
    if (musicAfterLogin(res.ok ? res.data : null) === "fade-out") {
      void music.fadeTo(0, FADE_OUT_MS);
    }
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {state.phase === "intro" ? (
          <IntroSplash key="intro" companyName={companyName} logoVariant={logoVariant} onStart={start} />
        ) : (
          <div key="scene" className="login-content">
            <BackgroundSlideshow />
            <SceneOverlays />
            <LoginShade />

            <div className="login-stage">
              <LogoSlam companyName={companyName} logoVariant={logoVariant} />

              <LoginCard shaking={state.banner === "denied"}>
                <LoginForm onResult={onResult} />
                {notice ? (
                  <p className="text-sm text-destructive" role="alert" aria-live="polite">
                    {notice}
                  </p>
                ) : null}
              </LoginCard>

              <StatusBanner banner={state.banner} name={name} />
            </div>

            <div className="login-hud-row">
              <LoginMusicHUD />
              <LoadingTips />
            </div>
          </div>
        )}
      </AnimatePresence>

      {flash ? <div aria-hidden className="login-flash" /> : null}

      {state.phase === "success" ? (
        <div aria-hidden className={cn("login-blackout", !reduced && "login-blackout-fade")} />
      ) : null}
    </>
  );
}
