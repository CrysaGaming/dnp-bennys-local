import { describe, expect, it } from "vitest";
import { isPublicPath } from "./public-paths";

describe("isPublicPath", () => {
  it("lässt Login und dessen Assets durch", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/login/bg-01.webp")).toBe(true);
    expect(isPublicPath("/icon.svg")).toBe(true);
  });

  it("lässt Auth-Route und Health durch", () => {
    expect(isPublicPath("/api/auth/sign-in/username")).toBe(true);
    expect(isPublicPath("/api/health")).toBe(true);
  });

  it("lässt Musikdateien durch", () => {
    expect(isPublicPath("/audio/strassen-im-blut.mp3")).toBe(true);
  });

  it("blockiert geschützte Seiten", () => {
    expect(isPublicPath("/dashboard")).toBe(false);
    expect(isPublicPath("/api/status")).toBe(false);
    expect(isPublicPath("/kunden/neu")).toBe(false);
  });
});
