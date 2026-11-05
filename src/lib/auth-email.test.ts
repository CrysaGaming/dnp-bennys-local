import { describe, expect, it } from "vitest";
import { internalEmail } from "./auth-email";

describe("internalEmail", () => {
  it("macht den Benutzernamen zur internen Adresse", () => {
    expect(internalEmail("Max.Power")).toBe("max.power@bennys.local");
  });
});
