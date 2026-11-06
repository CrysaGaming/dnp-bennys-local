import { beforeEach, describe, expect, it, vi } from "vitest";
import { readLoginMuted, writeLoginMuted } from "./login-mute-storage";

/** localStorage in der Node-Umgebung – der Zugriff im Modul läuft über `globalThis`. */
function fakeStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  };
}

describe("login-mute-storage", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", fakeStorage());
  });

  it("ist ohne gespeicherten Wert ausgeschaltet", () => {
    expect(readLoginMuted()).toBe(false);
  });

  it("speichert und liest", () => {
    writeLoginMuted(true);
    expect(readLoginMuted()).toBe(true);
  });

  it("gibt false, wenn der Speicher blockiert ist", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    });

    expect(readLoginMuted()).toBe(false);
    expect(() => writeLoginMuted(true)).not.toThrow();
  });
});
