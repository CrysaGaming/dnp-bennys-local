import { beforeEach, describe, expect, it, vi } from "vitest";
import { readStampsSeen, writeStampsSeen } from "./stamp-seen-storage";

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

describe("Stempelkarte zuletzt gesehen", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", fakeStorage());
  });

  it("schreibt und liest denselben Stand", () => {
    writeStampsSeen("c1", 7);
    expect(readStampsSeen("c1")).toBe(7);
  });

  it("ohne gespeicherten Wert ist der Stand null", () => {
    expect(readStampsSeen("niegesehen")).toBe(0);
  });

  it("Unsinn und negative Zahlen werden nicht übernommen", () => {
    globalThis.localStorage?.setItem("bennys:stamps-seen:c2", "fuffzig");
    globalThis.localStorage?.setItem("bennys:stamps-seen:c3", "-4");

    expect(readStampsSeen("c2")).toBe(0);
    expect(readStampsSeen("c3")).toBe(0);
  });

  it("ein blockierter Speicher ist kein Fehler", () => {
    vi.stubGlobal("localStorage", {
      get item() {
        throw new Error("Zugriff verweigert");
      },
    });

    expect(() => writeStampsSeen("c4", 3)).not.toThrow();
    expect(readStampsSeen("c4")).toBe(0);
  });
});
