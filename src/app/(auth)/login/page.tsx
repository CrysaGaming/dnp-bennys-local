import { headers } from "next/headers";
import { connection } from "next/server";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getLoginState, startRoute } from "@/lib/dal";
import { loginNotice } from "@/lib/login-notice";
import { getCompanySettings } from "@/features/company/service";
import { LoginScene } from "./_components/login-scene";
import { SceneFallback } from "./_components/scene-fallback";

/**
 * Login-Szene (Spec 6.1–6.3): immer dunkel, unabhängig vom gewählten Theme. Wer schon
 * eine echte Session hat, wird direkt umgeleitet und sieht das Intro nicht (Spec 3.2).
 *
 * Der datenabhängige Teil muss innerhalb einer Suspense-Grenze liegen: `cacheComponents`
 * prärendert die Route, und Runtime-Zugriffe (`connection()`, `headers()`) sind außerhalb
 * davon ein Fehler. Ohne Grenze steht die Seite schwarz und Next wirft die Meldung
 * „uncached data during prerendering or a navigation“.
 */
async function Scene() {
  // Die Session ist pro Request unterschiedlich, also darf dieser Teil nicht prärendered
  // werden – sonst läuft Better Auth beim Prerender und Next meldet `crypto.randomUUID()`
  // als instabilen Wert (und die Szene steht doppelt im HTML).
  await connection();

  const state = await getLoginState(await headers());
  if (state.kind === "context") redirect(startRoute(state.ctx));

  const settings = await getCompanySettings();

  return (
    <main className="dark login-scene bg-background text-foreground">
      <LoginScene
        companyName={settings.name}
        logoVariant={settings.logoVariant}
        notice={loginNotice(state)}
      />
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<SceneFallback />}>
      <Scene />
    </Suspense>
  );
}
