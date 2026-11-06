import { describe, expect, it } from "vitest";
import { computeIsOpen } from "@/lib/company-status";

describe("computeIsOpen (Spec 5.10)", () => {
  it("MANUAL: entscheidet nur der Schalter", () => {
    expect(computeIsOpen({ statusMode: "MANUAL", manualOpen: true, minOnDuty: 1 }, 0)).toBe(true);
    expect(computeIsOpen({ statusMode: "MANUAL", manualOpen: false, minOnDuty: 1 }, 5)).toBe(false);
  });

  it("AUTO: nur die Zahl der offenen Stempel", () => {
    expect(computeIsOpen({ statusMode: "AUTO", manualOpen: false, minOnDuty: 1 }, 0)).toBe(false);
    expect(computeIsOpen({ statusMode: "AUTO", manualOpen: false, minOnDuty: 1 }, 1)).toBe(true);
    expect(computeIsOpen({ statusMode: "AUTO", manualOpen: true, minOnDuty: 2 }, 1)).toBe(false);
  });
});
