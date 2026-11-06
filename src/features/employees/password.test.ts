import { describe, expect, it } from "vitest";
import { generateStartPassword } from "./password";

describe("generateStartPassword", () => {
  it("nutzt die eindeutige Zeichengruppe und 14 Zeichen", () => {
    const p = generateStartPassword();

    expect(p).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789]{14}$/);
  });

  it("ist jedes Mal anders", () => {
    expect(generateStartPassword()).not.toBe(generateStartPassword());
  });

  it("wirft genug Zufall für die Länge", () => {
    expect(generateStartPassword(20)).toHaveLength(20);
  });
});
