import { describe, expect, it } from "vitest";
import { musicAfterLogin } from "./music-after-login";

describe("musicAfterLogin", () => {
  it("blendet aus, wenn es keine Einstellung gibt", () => {
    expect(musicAfterLogin(null)).toBe("fade-out");
  });

  it("blendet aus, wenn Dashboard-Musik aus ist", () => {
    expect(musicAfterLogin({ dashboardMusic: false })).toBe("fade-out");
  });

  it("läuft weiter, wenn Dashboard-Musik an ist", () => {
    expect(musicAfterLogin({ dashboardMusic: true })).toBe("continue");
  });
});
