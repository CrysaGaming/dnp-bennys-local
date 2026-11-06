/** Der zuletzt gesehene Stand der Stempelkarte, pro Kunde und Browser (Spec 5.7). Nur Komfort. */
const PREFIX = "bennys:stamps-seen:";

function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function readStampsSeen(customerId: string): number {
  const store = storage();
  if (!store) return 0;

  try {
    const raw = store.getItem(`${PREFIX}${customerId}`);
    const value = Number(raw);
    return Number.isInteger(value) && value >= 0 ? value : 0;
  } catch {
    return 0;
  }
}

export function writeStampsSeen(customerId: string, count: number): void {
  const store = storage();
  if (!store) return;

  try {
    store.setItem(`${PREFIX}${customerId}`, String(count));
  } catch {
    // Private-Modus oder voller Speicher – die Animation ist nur Deko.
  }
}
