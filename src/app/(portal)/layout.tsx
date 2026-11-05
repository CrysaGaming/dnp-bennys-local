import { Suspense } from "react";
import { requireSession } from "@/lib/dal";
import { LogoutButton } from "@/components/auth/logout-button";

/**
 * Shell der Portalrouten. Alles, was den Session-Leser braucht, hängt in einer
 * Suspense-Grenze – ohne Grenze verbietet `cacheComponents` das Lesen von Runtime-Daten
 * bei einer Navigation. Der Rahmen selbst bleibt instant.
 */
async function UserInfo() {
  const ctx = await requireSession({ allowMustChangePassword: true });

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b px-6">
      <span className="font-display uppercase">Benny&apos;s Portal</span>
      <span className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">{ctx.name}</span>
        <LogoutButton />
      </span>
    </header>
  );
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <Suspense fallback={<div className="h-16 border-b" />}>
        <UserInfo />
      </Suspense>
      <main className="flex-1 p-6">
        <Suspense fallback={<div>Wird geladen…</div>}>{children}</Suspense>
      </main>
    </div>
  );
}
