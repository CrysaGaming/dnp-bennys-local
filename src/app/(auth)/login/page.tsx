import { headers } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/dal";
import { getCompanySettings } from "@/features/company/service";
import { LoginScene } from "./_components/login-scene";

/**
 * Login-Szene (Spec 6.1–6.3): immer dunkel, unabhängig vom gewählten Theme. Wer schon
 * eine echte Session hat, wird direkt umgeleitet und sieht das Intro nicht (Spec 3.2).
 * Die Session-Prüfung läuft innerhalb der Suspense-Grenze, weil `cacheComponents`
 * Runtime-Daten sonst nur beim ersten Render erlaubt.
 */
async function Scene() {
  // Die Session ist pro Request unterschiedlich, also darf dieser Teil nicht prärendered
  // werden – sonst läuft Better Auth beim Prerender und Next meldet `crypto.randomUUID()`
  // als instabilen Wert (und die Szene steht doppelt im HTML).
  await connection();

  const ctx = await getSessionContext(await headers());
  if (ctx) redirect("/dashboard");

  const settings = await getCompanySettings();

  return (
    <main className="dark login-scene bg-background text-foreground">
      <LoginScene companyName={settings.name} logoVariant={settings.logoVariant} />
    </main>
  );
}

export default function LoginPage() {
  return <Scene />;
}
