/**
 * Platzhalter für die Login-Szene, während der Session-Teil liest (Spec 6.1). Die Szene ist
 * immer dunkel; Name und Logo kommen direkt nach der Grenze, weil sie aus den Einstellungen
 * stammen und hier noch nicht gelesen werden dürfen.
 */
export function SceneFallback() {
  return (
    <main className="dark login-scene bg-background text-foreground" aria-busy="true">
      <div className="login-stage">
        <p className="text-sm text-muted-foreground">Wird geladen…</p>
      </div>
    </main>
  );
}
