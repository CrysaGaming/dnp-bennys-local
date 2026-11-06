import { describe, expect, it } from "vitest";
import { initialsOf } from "./initials";

describe("initialsOf", () => {
  it("nimmt die ersten zwei Anfangsbuchstaben", () => {
    expect(initialsOf("Max Power")).toBe("MP");
  });

  it("kürzt auf ein Zeichen, wenn nur ein Wort da ist", () => {
    expect(initialsOf("Benny")).toBe("B");
  });

  it("igniert mehrfache Leerzeichen", () => {
    expect(initialsOf("  Carlos   Ramirez ")).toBe("CR");
  });
});
