import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { completePasswordChange, setAvatar, updatePreferences, updateProfile } from "@/features/account/service";
import { makeCtx } from "@tests/helpers/factories";

describe("completePasswordChange", () => {
  it("setzt mustChangePassword auf false und schreibt Audit", async () => {
    const ctx = await makeCtx({ username: "pw-change" });
    await prisma.employee.update({
      where: { id: ctx.employeeId },
      data: { mustChangePassword: true },
    });

    await completePasswordChange(ctx);

    const employee = await prisma.employee.findUniqueOrThrow({ where: { id: ctx.employeeId } });
    expect(employee.mustChangePassword).toBe(false);

    const audit = await prisma.auditLog.findFirstOrThrow({
      where: { action: "account.password_changed" },
    });
    expect(audit).toMatchObject({
      actorId: ctx.userId,
      entity: "employee",
      entityId: ctx.employeeId,
    });
  });
});

describe("updateProfile", () => {
  it("ändert IC-Name und Telefon", async () => {
    const ctx = await makeCtx({ username: "profil" });

    await updateProfile(ctx, { name: "Carlos Ramirez", phone: "555-0123" });

    const user = await prisma.user.findUniqueOrThrow({ where: { id: ctx.userId } });
    const employee = await prisma.employee.findUniqueOrThrow({ where: { id: ctx.employeeId } });
    expect(user.name).toBe("Carlos Ramirez");
    expect(employee.phone).toBe("555-0123");

    const audit = await prisma.auditLog.findFirstOrThrow({ where: { action: "account.profile_updated" } });
    expect(audit.entityId).toBe(ctx.employeeId);
  });

  it("lehnt einen Namen mit einem Zeichen ab", async () => {
    const ctx = await makeCtx({ username: "profil-kurz" });
    await expect(updateProfile(ctx, { name: "A", phone: null })).rejects.toThrow(ZodError);
  });

  it("lässt das Telefon leer, wenn keines gegeben ist", async () => {
    const ctx = await makeCtx({ username: "profil-leer" });

    await updateProfile(ctx, { name: "Solo", phone: null });

    const employee = await prisma.employee.findUniqueOrThrow({ where: { id: ctx.employeeId } });
    expect(employee.phone).toBeNull();
  });
});

describe("setAvatar", () => {
  it("setzt die Avatar-URL am User", async () => {
    const ctx = await makeCtx({ username: "avatar" });

    await setAvatar(ctx, "/api/files/avatars/abc.png");

    const user = await prisma.user.findUniqueOrThrow({ where: { id: ctx.userId } });
    expect(user.image).toBe("/api/files/avatars/abc.png");
  });

  it("entfernt den Avatar wieder", async () => {
    const ctx = await makeCtx({ username: "avatar-weg" });

    await setAvatar(ctx, null);

    const user = await prisma.user.findUniqueOrThrow({ where: { id: ctx.userId } });
    expect(user.image).toBeNull();
  });
});

describe("updatePreferences", () => {
  it("legt die Einstellungszeile an, wenn sie noch fehlt", async () => {
    const ctx = await makeCtx({ username: "prefs" });

    const prefs = await updatePreferences(ctx, { theme: "DARK", reducedMotion: true });

    const row = await prisma.userPreference.findUniqueOrThrow({ where: { userId: ctx.userId } });
    expect(row.theme).toBe("DARK");
    expect(row.reducedMotion).toBe(true);
    expect(prefs).toEqual({ theme: "DARK", reducedMotion: true });
  });

  it("ändert eine bestehende Zeile", async () => {
    const ctx = await makeCtx({ username: "prefs-zwei" });

    await updatePreferences(ctx, { theme: "LIGHT", reducedMotion: false });
    await updatePreferences(ctx, { theme: "SYSTEM", reducedMotion: true });

    const row = await prisma.userPreference.findUniqueOrThrow({ where: { userId: ctx.userId } });
    expect(row).toMatchObject({ theme: "SYSTEM", reducedMotion: true });
  });
});
