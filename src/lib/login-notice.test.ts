import { describe, expect, it } from "vitest";
import { loginNotice } from "./login-notice";

describe("loginNotice", () => {
  it("Texte für die Gründe", () => {
    expect(loginNotice({ kind: "no_profile", username: "max", reason: "missing" })).toBe(
      "Kein Mitarbeiterprofil gefunden.",
    );
    expect(loginNotice({ kind: "no_profile", username: "max", reason: "terminated" })).toBe(
      "Dein Mitarbeiterprofil ist nicht mehr aktiv.",
    );
    expect(loginNotice({ kind: "no_profile", username: "max", reason: "banned" })).toBe(
      "Dein Zugang ist gesperrt.",
    );
  });

  it("ohne Grund kein Text", () => {
    expect(loginNotice({ kind: "none" })).toBeNull();
    expect(loginNotice({ kind: "context", ctx: {} as never })).toBeNull();
  });
});
