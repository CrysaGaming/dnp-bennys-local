import { describe, expect, it, vi } from "vitest";
import { onFirstInteraction } from "./first-interaction";

/** Kein Fenster in der Node-Umgebung – ein kleiner Ziel-Ersatz reicht für die Logik. */
function fakeTarget() {
  const listeners = new Map<string, Set<(e: unknown) => void>>();

  return {
    addEventListener: (type: string, cb: (e: unknown) => void) => {
      const set = listeners.get(type) ?? new Set();
      set.add(cb);
      listeners.set(type, set);
    },
    removeEventListener: (type: string, cb: (e: unknown) => void) => {
      listeners.get(type)?.delete(cb);
    },
    emit: (type: string) => {
      for (const cb of listeners.get(type) ?? []) cb({});
    },
  };
}

describe("onFirstInteraction", () => {
  it("ruft den Callback einmal und dann nie wieder", () => {
    const target = fakeTarget();
    const cb = vi.fn();

    onFirstInteraction(cb, target);

    target.emit("pointerdown");
    target.emit("keydown");

    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("meldet die Abmeldung zurück und hört danach auf", () => {
    const target = fakeTarget();
    const cb = vi.fn();

    const off = onFirstInteraction(cb, target);
    off();

    target.emit("pointerdown");

    expect(cb).not.toHaveBeenCalled();
  });
});
