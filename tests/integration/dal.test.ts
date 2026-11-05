import { describe, expect, it } from "vitest";
import { auth } from "@/lib/auth";
import { internalEmail } from "@/lib/auth-email";
import { prisma } from "@/lib/prisma";
import { getSessionContext } from "@/lib/dal";
import { createRank } from "@tests/helpers/factories";
import { signInHeaders } from "@tests/helpers/session";
import type { Permission } from "@/generated/prisma/enums";

const password = "Sicher-Passwort-1";

/** User mit Passwort (für echtes Login) plus Employee und Rang mit Rechten. */
async function createEmployee(
  username: string,
  opts: { permissions?: Permission[]; level?: number; role?: "admin" | "user" } = {},
) {
  const { user } = await auth.api.createUser({
    body: {
      email: internalEmail(username),
      password,
      name: username,
      role: opts.role ?? "user",
      data: { username },
    },
  });

  const rank = await createRank({
    level: opts.level ?? 10,
    permissions: opts.permissions ?? [],
  });

  const employee = await prisma.employee.create({
    data: { userId: user!.id, rankId: rank.id, serviceNumber: 1 },
  });

  return { user: user!, employee, rank };
}

describe("getSessionContext", () => {
  it("liefert Kontext mit erweiterten Rechten", async () => {
    await createEmployee("max", { permissions: ["ORDERS_MANAGE"] });

    const ctx = await getSessionContext(await signInHeaders("max", password));

    expect(ctx?.permissions).toEqual(expect.arrayContaining(["ORDERS_MANAGE", "ORDERS_VIEW"]));
    expect(ctx?.rank.level).toBe(10);
    expect(ctx?.isAdmin).toBe(false);
  });

  it("null bei gesperrtem User", async () => {
    const { user } = await createEmployee("tom");
    const headers = await signInHeaders("tom", password);

    await prisma.user.update({ where: { id: user.id }, data: { banned: true } });

    expect(await getSessionContext(headers)).toBeNull();
  });

  it("null bei gekündigtem Mitarbeiter", async () => {
    const { user } = await createEmployee("mia");
    const headers = await signInHeaders("mia", password);

    await prisma.employee.update({ where: { userId: user.id }, data: { status: "TERMINATED" } });

    expect(await getSessionContext(headers)).toBeNull();
  });

  it("null ohne Cookie", async () => {
    expect(await getSessionContext(new Headers())).toBeNull();
  });
});
