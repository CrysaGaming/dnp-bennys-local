import { describe, expect, it } from "vitest";
import { LOADING_TIPS, nextTipIndex } from "./loading-tips";

describe("loading-tips", () => {
  it("hat genau die drei Tipps aus Spec 6.3", () => {
    expect(LOADING_TIPS).toEqual([
      "Stempel dich ein, bevor du Aufträge annimmst.",
      "Teile unter Mindestbestand siehst du rot im Lager.",
      "Rechnungen erst nach Bezahlung als bezahlt markieren.",
    ]);
  });

  it("dreht am Ende wieder von vorn", () => {
    expect(nextTipIndex(2, 3)).toBe(0);
    expect(nextTipIndex(0, 3)).toBe(1);
  });

  it("gibt bei leerer Liste 0", () => {
    expect(nextTipIndex(0, 0)).toBe(0);
  });
});
