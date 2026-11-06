import { describe, expect, it } from "vitest";
import { isLowStock } from "./low-stock";

describe("isLowStock", () => {
  it("ist knapp, wenn der Bestand unter dem Mindestbestand liegt", () => {
    expect(isLowStock({ stock: 3, minStock: 5 })).toBe(true);
  });

  it("ist nicht knapp, wenn der Mindestbestand erreicht ist", () => {
    expect(isLowStock({ stock: 5, minStock: 5 })).toBe(false);
  });

  it("ist nie knapp ohne Mindestbestand", () => {
    expect(isLowStock({ stock: 0, minStock: 0 })).toBe(false);
  });
});
