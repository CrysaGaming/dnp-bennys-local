import { describe, expect, it } from "vitest";
import { ConflictError, ForbiddenError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { seed } from "../../prisma/seed";
import { createRank as makeRank, makeCtx, seedEnv } from "@tests/helpers/factories";
import { ctxForUsername } from "@tests/helpers/session";
import {
  createEmployee,
  listEmployees,
  resetEmployeePassword,
  terminateEmployee,
  updateEmployee,
} from "@/features/employees/service";

describe("employees", () => {
  it("braucht EMPLOYEES_MANAGE zum Anlegen", async () => {
    const ctx = await makeCtx({ permissions: ["EMPLOYEES_VIEW"], level: 50 });
    const rank = await makeRank({ level: 20 });

    await expect(
      createEmployee(ctx, { name: "Max Power", username: "max", rankId: rank.id, serviceNumber: 7, phone: "" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("legt User und Employee an und das Startpasswort funktioniert", async () => {
    const ctx = await makeCtx({ permissions: ["EMPLOYEES_MANAGE"], level: 50 });
    const rank = await makeRank({ level: 20 });

    const { employeeId, startPassword } = await createEmployee(ctx, {
      name: "Max Power",
      username: "max",
      rankId: rank.id,
      serviceNumber: 7,
      phone: "",
    });

    const user = await prisma.user.findUniqueOrThrow({ where: { id: (await prisma.employee.findUniqueOrThrow({ where: { id: employeeId } })).userId } });
    expect(user).toMatchObject({ username: "max", email: "max@bennys.local", role: "user" });

    const employee = await prisma.employee.findUniqueOrThrow({ where: { id: employeeId } });
    expect(employee.mustChangePassword).toBe(true);
    expect(employee.phone).toBeNull();

    const signIn = await auth.api.signInUsername({ body: { username: "max", password: startPassword } });
    expect(signIn?.user?.id).toBe(user.id);

    const audit = await prisma.auditLog.findFirstOrThrow({ where: { action: "employee.create" } });
    expect(audit).toMatchObject({ actorId: ctx.userId, entity: "employee", entityId: employeeId });
  });

  it("nur Mitarbeiter unter dem eigenen Rang", async () => {
    const ctx = await makeCtx({ permissions: ["EMPLOYEES_MANAGE"], level: 50 });
    // Der eigene Rang hat schon Level 50 – ein zweiter Rang mit 50 wäre ein Unique-Fehler,
    // also ein Rang darüber.
    const rank = await makeRank({ level: 60 });

    await expect(
      createEmployee(ctx, { name: "Gleich", username: "gleich", rankId: rank.id, serviceNumber: 8, phone: "" }),
    ).rejects.toThrow("Du kannst nur Mitarbeiter unter deinem Rang verwalten.");
  });

  it("doppelter Benutzername und doppelte Dienstnummer", async () => {
    const ctx = await makeCtx({ permissions: ["EMPLOYEES_MANAGE"], level: 50 });
    const rank = await makeRank({ level: 20 });

    await createEmployee(ctx, { name: "Eins", username: "eins", rankId: rank.id, serviceNumber: 9, phone: "" });

    const dupName = await createEmployee(ctx, {
      name: "Zwei",
      username: "eins",
      rankId: rank.id,
      serviceNumber: 10,
      phone: "",
    }).catch((e) => e);
    expect(dupName).toBeInstanceOf(ConflictError);
    expect((dupName as ConflictError).field).toBe("username");
    expect((dupName as ConflictError).message).toBe("Benutzername ist vergeben");

    const dupNumber = await createEmployee(ctx, {
      name: "Drei",
      username: "drei",
      rankId: rank.id,
      serviceNumber: 9,
      phone: "",
    }).catch((e) => e);
    expect(dupNumber).toBeInstanceOf(ConflictError);
    expect((dupNumber as ConflictError).field).toBe("serviceNumber");
    expect((dupNumber as ConflictError).message).toBe("Dienstnummer ist vergeben");

    // Kein verwaister User: der fehlgeschlagene Versuch hat nichts hinterlassen.
    expect(await prisma.user.count({ where: { username: "drei" } })).toBe(0);
  });

  it("sperrt: Status, terminatedAt, banned, keine Sessions", async () => {
    const ctx = await makeCtx({ permissions: ["EMPLOYEES_MANAGE"], level: 50 });
    const rank = await makeRank({ level: 20 });
    const { employeeId } = await createEmployee(ctx, {
      name: "Sperren",
      username: "sperren",
      rankId: rank.id,
      serviceNumber: 11,
      phone: "",
    });

    await terminateEmployee(ctx, employeeId, "Hat das Portal gelöscht.");

    const employee = await prisma.employee.findUniqueOrThrow({ where: { id: employeeId } });
    expect(employee.status).toBe("TERMINATED");
    expect(employee.terminatedAt).not.toBeNull();

    const user = await prisma.user.findUniqueOrThrow({ where: { id: employee.userId } });
    expect(user.banned).toBe(true);
    expect(await prisma.session.count({ where: { userId: user.id } })).toBe(0);
  });

  it("sich nicht selbst sperren", async () => {
    const ctx = await makeCtx({ permissions: ["EMPLOYEES_MANAGE"], level: 50 });

    await expect(terminateEmployee(ctx, ctx.employeeId, null)).rejects.toThrow(
      "Du kannst dich nicht selbst sperren.",
    );
  });

  it("der letzte Admin kann nicht gesperrt oder herabgestuft werden", async () => {
    // Review Focus 5
    await seed(prisma, seedEnv);

    const actorCtx = await ctxForUsername(seedEnv.adminUsername);
    const otherRank = await makeRank({ level: 20 });

    await expect(terminateEmployee(actorCtx, actorCtx.employeeId, null)).rejects.toThrow(
      "Der letzte Admin kann nicht gesperrt werden.",
    );

    await expect(
      updateEmployee(actorCtx, actorCtx.employeeId, {
        name: actorCtx.name,
        rankId: otherRank.id,
        serviceNumber: 900,
        phone: "",
        status: "ACTIVE",
        notes: "",
      }),
    ).rejects.toThrow("Der letzte Admin kann nicht herabgestuft werden.");
  });

  it("listet nur, was der eigene Rang sieht", async () => {
    const chef = await makeCtx({ permissions: ["EMPLOYEES_MANAGE"], level: 50 });
    const viewer = await makeCtx({ permissions: ["EMPLOYEES_VIEW"], level: 40 });
    const rank = await makeRank({ level: 20 });

    const { employeeId } = await createEmployee(chef, {
      name: "Gelistet",
      username: "gelistet",
      rankId: rank.id,
      serviceNumber: 12,
      phone: "555-0100",
    });

    const rows = await listEmployees(viewer);
    const row = rows.find((r) => r.id === employeeId);

    expect(row).toMatchObject({
      name: "Gelistet",
      username: "gelistet",
      serviceNumber: 12,
      phone: "555-0100",
      status: "ACTIVE",
      rank: { name: rank.name, level: 20 },
    });
  });

  it("setzt das Passwort zurück und erzwingt den Wechsel", async () => {
    const ctx = await makeCtx({ permissions: ["EMPLOYEES_MANAGE"], level: 50 });
    const rank = await makeRank({ level: 20 });

    const { employeeId, startPassword } = await createEmployee(ctx, {
      name: "Zurücksetzen",
      username: "zuruecksetzen",
      rankId: rank.id,
      serviceNumber: 13,
      phone: "",
    });

    const userId = (await prisma.employee.findUniqueOrThrow({ where: { id: employeeId } })).userId;

    const { startPassword: neu } = await resetEmployeePassword(ctx, employeeId);

    const alt = await auth.api
      .signInUsername({ body: { username: "zuruecksetzen", password: startPassword } })
      .catch((e) => e);
    expect(alt).toBeInstanceOf(Error);

    const frisch = await auth.api.signInUsername({ body: { username: "zuruecksetzen", password: neu } });
    expect(frisch?.user?.id).toBe(userId);

    const employee = await prisma.employee.findUniqueOrThrow({ where: { id: employeeId } });
    expect(employee.mustChangePassword).toBe(true);
  });
});
