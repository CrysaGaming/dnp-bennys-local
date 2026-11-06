import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { MotionPreference } from "./motion-preference";

describe("MotionPreference", () => {
  it("setzt data-reduced-motion auf true, wenn der Nutzer Bewegungen reduziert", () => {
    document.documentElement.dataset.reducedMotion = "false";

    render(
      <MotionPreference reduced>
        <p>Bewegung</p>
      </MotionPreference>,
    );

    expect(document.documentElement.dataset.reducedMotion).toBe("true");
  });

  it("lässt die System-Vorgabe offen, wenn nicht reduziert ist", () => {
    document.documentElement.dataset.reducedMotion = "true";

    render(
      <MotionPreference reduced={false}>
        <p>Bewegung</p>
      </MotionPreference>,
    );

    expect(document.documentElement.dataset.reducedMotion).toBe("false");
  });
});
