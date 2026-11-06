import { describe, expect, it } from "vitest";
import { decodeCursor, encodeCursor } from "./cursor";

describe("Cursor", () => {
  it("Hin- und Rückweg ergeben dieselben Werte", () => {
    const cursor = { createdAt: new Date("2026-11-05T12:00:00.000Z"), id: "cmabc123" };

    const encoded = encodeCursor(cursor);
    expect(decodeCursor(encoded)).toEqual(cursor);

    // base64url: keine +, / oder = – der Cursor steckt sauber in einer URL.
    expect(encoded).not.toMatch(/[+/=]/);
  });

  it("ungültig wird null, nicht eine Ausnahme", () => {
    expect(decodeCursor("kaputt")).toBeNull();
    expect(decodeCursor("")).toBeNull();
    expect(decodeCursor("e32f")).toBeNull();
    expect(decodeCursor(Buffer.from("nicht als json").toString("base64url"))).toBeNull();
  });
});
