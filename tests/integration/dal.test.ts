import { describe, expect, it } from "vitest";
import { auth } from "@/lib/auth";
import { internalEmail } from "@/lib/auth-email";
import { prisma } from "@/lib/prisma";
import { getSessionContext, getLoginState, startRoute } from "@/lib/dal";
import { createRank, makeCtx } from "@tests/helpers/factories";
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

describe("getLoginState", () => {
  it("User ohne Employee: Grund missing, Name für die Meldung", async () => {
    await auth.api.createUser({
      body: {
        email: internalEmail("ohnekarte"),
        password,
        name: "Ohne Karte",
        data: { username: "ohnekarte" },
      },
    });

    const state = await getLoginState(await signInHeaders("ohnekarte", password));

    expect(state.kind).toBe("no_profile");
    expect(state.kind === "no_profile" ? state.reason : null).toBe("missing");
    expect(state.kind === "no_profile" ? state.username : null).toBe("ohnekarte");
  });

  it("gekündigter Mitarbeiter: Grund terminated", async () => {
    const { user } = await createEmployee("gina");
    const headers = await signInHeaders("gina", password);

    await prisma.employee.update({ where: { userId: user.id }, data: { status: "TERMINATED" } });

    const state = await getLoginState(headers);

    expect(state.kind).toBe("no_profile");
    expect(state.kind === "no_profile" ? state.reason : null).toBe("terminated");
  });

  it("gesperrter User: Grund banned", async () => {
    const { user } = await createEmployee("nina");
    const headers = await signInHeaders("nina", password);

    await prisma.user.update({ where: { id: user.id }, data: { banned: true } });

    const state = await getLoginState(headers);

    expect(state.kind).toBe("no_profile");
    expect(state.kind === "no_profile" ? state.reason : null).toBe("banned");
  });

  it("normaler Mitarbeiter: Kontext", async () => {
    await createEmployee("okuser");

    const state = await getLoginState(await signInHeaders("okuser", password));

    expect(state.kind).toBe("context");
    expect(state.kind === "context" ? state.ctx.username : null).toBe("okuser");
  });

  it("ohne Session: kind none", async () => {
    const state = await getLoginState(new Headers());

    expect(state.kind).toBe("none");
  });
});

describe("startRoute", () => {
  it("führt zur Passwortseite, wenn das Flag gesetzt ist", async () => {
    const ctx = await makeCtx({ username: "start-route" });

    expect(startRoute({ ...ctx, mustChangePassword: true })).toBe("/settings?pw=1");
    expect(startRoute({ ...ctx, mustChangePassword: false })).toBe("/dashboard");
  });
});
