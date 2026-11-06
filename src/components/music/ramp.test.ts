import { describe, expect, it } from "vitest";
import { rampVolume } from "./ramp";

describe("rampVolume", () => {
  it("startet bei from", () => {
    expect(rampVolume(0, 0.35, 2000, 0)).toBe(0);
  });

  it("liegt in der Mitte linear", () => {
    expect(rampVolume(0, 0.35, 2000, 1000)).toBeCloseTo(0.175);
  });

  it("bleibt nach dem Ende auf to", () => {
    expect(rampVolume(0, 0.35, 2000, 5000)).toBe(0.35);
  });

  it("rampet abwärts", () => {
    expect(rampVolume(0.35, 0, 800, 400)).toBeCloseTo(0.175);
  });

  it("begrenzt auf 0–1", () => {
    expect(rampVolume(0, 1, 100, 900)).toBe(1);
    expect(rampVolume(0.5, 0, 100, 900)).toBe(0);
  });

  it("setzt bei null Dauer sofort auf to", () => {
    expect(rampVolume(0.2, 0.6, 0, 0)).toBe(0.6);
  });
});
