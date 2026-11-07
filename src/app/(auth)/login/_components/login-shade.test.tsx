import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoginShade } from "./login-shade";

/**
 * Spec 6.2 verlangt den dunklen Schatten unten über der Szene, damit die Tipps kontrastreich
 * genug sind. Er ist eine eigene Ebene – ohne ihn steht der HUD-Text direkt auf dem Foto.
 */
describe("LoginShade", () => {
  it("legt die Schattenebene über die Szene", () => {
    const { container } = render(<LoginShade />);
    const ebene = container.querySelector(".login-shade");

    expect(ebene).not.toBe(null);
    expect(ebene!.getAttribute("aria-hidden")).toBe("true");
  });
});
