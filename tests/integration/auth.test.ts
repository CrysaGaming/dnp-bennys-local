import { describe, expect, it } from "vitest";
import { auth } from "@/lib/auth";
import { internalEmail } from "@/lib/auth-email";
import { prisma } from "@/lib/prisma";

describe("Better Auth", () => {
  it("legt User per Admin-API an und meldet per Benutzername an", async () => {
    await auth.api.createUser({
      body: {
        email: internalEmail("max"),
        password: "Sicher-Passwort-1",
        name: "Max Power",
        data: { username: "max" },
      },
    });

    const res = await auth.api.signInUsername({
      body: { username: "max", password: "Sicher-Passwort-1" },
    });

    expect(res?.user.username).toBe("max");
  });

  it("lehnt öffentliche Registrierung ab", async () => {
    await expect(
      auth.api.signUpEmail({
        body: { email: "x@bennys.local", password: "Sicher-Passwort-1", name: "X" },
      }),
    ).rejects.toMatchObject({ body: { code: "EMAIL_PASSWORD_SIGN_UP_DISABLED" } });
  });

  it("lässt gesperrte User nicht rein", async () => {
    const { user } = await auth.api.createUser({
      body: {
        email: internalEmail("tom"),
        password: "Sicher-Passwort-1",
        name: "Tom",
        data: { username: "tom" },
      },
    });

    await prisma.user.update({ where: { id: user.id }, data: { banned: true } });

    await expect(
      auth.api.signInUsername({ body: { username: "tom", password: "Sicher-Passwort-1" } }),
    ).rejects.toBeTruthy();
  });
});
