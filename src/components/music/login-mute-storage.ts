/** Mute der Login-Seite, pro Browser (Spec 6.4). Auf der Login-Seite ist noch kein User bekannt. */
const KEY = "bennys:login-muted";

function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** Fehler beim Zugriff zählen als „kein gespeicherter Wert“ ⇒ `false`. */
export function readLoginMuted(): boolean {
  const store = storage();
  if (!store) return false;

  try {
    return store.getItem(KEY) === "true";
  } catch {
    return false;
  }
}

export function writeLoginMuted(muted: boolean): void {
  const store = storage();
  if (!store) return;

  try {
    store.setItem(KEY, muted ? "true" : "false");
  } catch {
    // localStorage kann blockiert sein (Private-Modus) – die Einstellung ist nur Komfort.
  }
}
