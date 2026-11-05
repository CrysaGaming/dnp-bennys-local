import { describe, expect, it } from "vitest";
import { loginSchema, passwordChangeSchema } from "./schemas";

describe("loginSchema", () => {
  it("akzeptiert einen normalen Benutzernamen", () => {
    const r = loginSchema.safeParse({ username: "Max.Power", password: "Sicher-Passwort-1" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.username).toBe("Max.Power");
  });

  it("lehnt zu kurze Namen und Sonderzeichen ab", () => {
    expect(loginSchema.safeParse({ username: "ab", password: "Sicher-Passwort-1" }).success).toBe(false);
    expect(loginSchema.safeParse({ username: "max!", password: "Sicher-Passwort-1" }).success).toBe(false);
  });

  it("normalisiert den Benutzername", () => {
    const r = loginSchema.safeParse({ username: "  max  ", password: "Sicher-Passwort-1" });
    if (r.success) expect(r.data.username).toBe("max");
  });
});

describe("passwordChangeSchema", () => {
  const base = { currentPassword: "Start-Passwort-123" };

  it("verlangt mindestens 10 Zeichen und Bestätigung", () => {
    expect(
      passwordChangeSchema.safeParse({ ...base, newPassword: "kurz", confirmPassword: "kurz" }).success,
    ).toBe(false);
    expect(
      passwordChangeSchema.safeParse({
        ...base,
        newPassword: "Neues-Passwort-123",
        confirmPassword: "Neues-Passwort-12",
      }).success,
    ).toBe(false);
  });

  it("lehnt das alte Passwort als neues ab", () => {
    expect(
      passwordChangeSchema.safeParse({
        ...base,
        newPassword: base.currentPassword,
        confirmPassword: base.currentPassword,
      }).success,
    ).toBe(false);
  });

  it("akzeptiert ein neues, bestätigtes Passwort", () => {
    expect(
      passwordChangeSchema.safeParse({
        ...base,
        newPassword: "Neues-Passwort-123",
        confirmPassword: "Neues-Passwort-123",
      }).success,
    ).toBe(true);
  });
});
