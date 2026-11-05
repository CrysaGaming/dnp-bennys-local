import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/dal";
import { LoginForm } from "./_components/login-form";

/**
 * Login-Szene: immer dunkel, Wortmark im Sunset-Verlauf, keine Musik (Spec 4.6).
 * Die Session-Prüft läuft innerhalb einer Suspense-Grenze – `cacheComponents`
 * erlaubt Runtime-Daten sonst nur beim ersten Render, nicht bei einer Navigation.
 */
async function Scene() {
  const ctx = await getSessionContext(await headers());
  if (ctx) redirect("/dashboard");

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 flex flex-col items-start gap-2">
        <span className="font-display bg-sunset bg-clip-text text-4xl leading-none tracking-tight text-transparent uppercase">
          Benny&apos;s
        </span>
        <span className="text-sm text-muted-foreground">Mitarbeiterportal · DNP Roleplay</span>
      </div>

      <LoginForm />

      <p className="mt-6 text-sm text-muted-foreground">
        Accounts legt der Chef von Benny&apos;s an – keine Selbstregistrierung.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="dark flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-12 text-foreground">
      <Suspense fallback={<div>Wird geladen…</div>}>
        <Scene />
      </Suspense>
    </main>
  );
}
