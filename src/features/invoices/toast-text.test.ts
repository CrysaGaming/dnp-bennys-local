import { describe, expect, it } from "vitest";
import { paidToast } from "./toast-text";

describe("paidToast", () => {
  it("Stempel", () => {
    expect(paidToast({ mode: "STAMPS", earned: 1, name: "Carlos Ramirez" })).toBe(
      "Bezahlt. +1 Stempel für Carlos Ramirez",
    );
    expect(paidToast({ mode: "STAMPS", earned: 3, name: "Carlos Ramirez" })).toBe(
      "Bezahlt. +3 Stempel für Carlos Ramirez",
    );
  });

  it("Punkte", () => {
    expect(paidToast({ mode: "POINTS", earned: 12, name: "Carlos Ramirez" })).toBe(
      "Bezahlt. +12 Punkte für Carlos Ramirez",
    );
  });

  it("ohne Gutschrift bleibt nur das Bezahlt", () => {
    expect(paidToast({ mode: "STAMPS", earned: 0, name: "Carlos Ramirez" })).toBe("Bezahlt.");
  });
});
