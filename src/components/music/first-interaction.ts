/**
 * Autoplay ist im Browser blockiert (Spec 6.4). Nach dem Neuladen im Dashboard startet
 * die Musik deshalb beim ersten Klick oder Tastendruck – der Listener ist einmalig.
 */
export type InteractionTarget = {
  addEventListener: (type: string, listener: (event: unknown) => void) => void;
  removeEventListener: (type: string, listener: (event: unknown) => void) => void;
};

const EVENTS = ["pointerdown", "keydown"] as const;

/** Gibt die Abmeldung zurück. */
export function onFirstInteraction(
  callback: () => void,
  target: InteractionTarget = globalThis as unknown as InteractionTarget,
): () => void {
  function handler() {
    off();
    callback();
  }

  function off() {
    for (const type of EVENTS) target.removeEventListener(type, handler);
  }

  for (const type of EVENTS) target.addEventListener(type, handler);

  return off;
}
