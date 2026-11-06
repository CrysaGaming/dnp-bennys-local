import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { ConflictError, ForbiddenError } from "@/lib/errors";
import { seed } from "../../prisma/seed";
import { createEmployeeForRank, makeCtx, seedEnv } from "@tests/helpers/factories";
import { ctxForUsername } from "@tests/helpers/session";
import { createRank, listRanks, updateRank, deleteRank, type RankRow } from "@/features/ranks/service";

const valid = (overrides: Record<string, unknown> = {}) => ({
  name: "Testrang",
  level: 10,
  color: "#FF8A3D",
  hourlyWage: 900,
  permissions: [],
  ...overrides,
});

describe("ranks", () => {
  it("braucht RANKS_MANAGE", async () => {
    const ctx = await makeCtx({ permissions: [], level: 50 });

    await expect(createRank(ctx, valid({ level: 10 }))).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("speichert Rechte mit Abhängigkeiten", async () => {
    const ctx = await makeCtx({ isAdmin: true });

    const rank = await createRank(ctx, valid({ name: "Mechaniker", level: 20, permissions: ["RESOURCES_MANAGE"] }));

    expect(new Set(rank.permissions)).toEqual(new Set(["RESOURCES_MANAGE", "RESOURCES_VIEW"]));
  });

  it("Level muss unter dem eigenen liegen", async () => {
    const ctx = await makeCtx({ permissions: ["RANKS_MANAGE"], level: 50 });

    await expect(createRank(ctx, valid({ level: 50 }))).rejects.toThrow(
      "Level muss unter deinem eigenen liegen.",
    );
  });

  it("nur eigene Rechte vergeben", async () => {
    const ctx = await makeCtx({ permissions: ["RANKS_MANAGE"], level: 50 });

    await expect(createRank(ctx, valid({ level: 10, permissions: ["COMPANY_MANAGE"] }))).rejects.toThrow(
      "Du kannst nur Rechte vergeben, die du selbst hast.",
    );
  });

  it("Admin-Rang ist geschützt", async () => {
    // Review Focus 5
    await seed(prisma, seedEnv);

    // Der Kontext aus dem Seed – `makeCtx({ isAdmin: true })` würde einen zweiten Rang
    // mit Level 100 anlegen und gegen das Unique-Level laufen.
    const ctx = await ctxForUsername(seedEnv.adminUsername);
    const admin = await prisma.rank.findUniqueOrThrow({ where: { level: 100 } });

    await expect(updateRank(ctx, admin.id, valid({ level: 99, permissions: [] }))).rejects.toThrow(
      "Der Admin-Rang ist geschützt.",
    );
    await expect(deleteRank(ctx, admin.id)).rejects.toThrow("Der Admin-Rang ist geschützt.");
  });

  it("eigenen Rang nicht ändern", async () => {
    // Review Focus 5
    const ctx = await makeCtx({ permissions: ["RANKS_MANAGE"], level: 50 });

    await expect(updateRank(ctx, ctx.rank.id, valid({ level: 49 }))).rejects.toThrow(
      "Level muss unter deinem eigenen liegen.",
    );
  });

  it("Löschen nur ohne Mitarbeiter", async () => {
    const ctx = await makeCtx({ isAdmin: true });
    const rank = await createRank(ctx, valid({ name: "Vollläufer", level: 30 }));

    for (let i = 0; i < 2; i += 1) {
      await createEmployeeForRank(rank.id);
    }

    await expect(deleteRank(ctx, rank.id)).rejects.toThrow(
      "Diesem Rang sind noch 2 Mitarbeiter zugeordnet.",
    );

    // Ohne Mitarbeiter geht es.
    for (const employee of await prisma.employee.findMany({ where: { rankId: rank.id } })) {
      await prisma.employee.delete({ where: { id: employee.id } });
    }
    await deleteRank(ctx, rank.id);

    expect(await prisma.rank.findUnique({ where: { id: rank.id } })).toBeNull();
  });

  it("doppeltes Level", async () => {
    const ctx = await makeCtx({ isAdmin: true });

    await createRank(ctx, valid({ name: "Einrang", level: 20 }));

    const error = await createRank(ctx, valid({ name: "Anderrang", level: 20 })).catch((e) => e);
    expect(error).toBeInstanceOf(ConflictError);
    expect((error as ConflictError).field).toBe("level");
    expect((error as ConflictError).message).toBe("Dieses Level ist schon vergeben");
  });

  it("listet sortiert nach Level absteigend und zählt Mitarbeiter", async () => {
    const ctx = await makeCtx({ isAdmin: true });

    const oben = await createRank(ctx, valid({ name: "Oben", level: 60 }));
    const unten = await createRank(ctx, valid({ name: "Unten", level: 11 }));

    const rows: RankRow[] = await listRanks(ctx);
    const names = rows.map((r) => r.name);

    // Der Kontext-Rang ist dabei – geprüft wird die Reihenfolge der beiden angelegten.
    expect(names.indexOf(oben.name)).toBeLessThan(names.indexOf(unten.name));
    expect(rows.find((r) => r.id === oben.id)).toMatchObject({
      employeeCount: 0,
      color: "#FF8A3D",
      hourlyWage: 900,
      level: 60,
    });
  });

  it("schreibt Audit mit vorher und nachher", async () => {
    const ctx = await makeCtx({ isAdmin: true });
    const rank = await createRank(ctx, valid({ name: "Auditrang", level: 40, permissions: ["ORDERS_VIEW"] }));

    await updateRank(ctx, rank.id, valid({ name: "Auditrang", level: 40, permissions: ["ORDERS_CREATE"] }));

    const audit = await prisma.auditLog.findFirstOrThrow({ where: { action: "rank.update" } });
    expect(audit).toMatchObject({ actorId: ctx.userId, entity: "rank", entityId: rank.id });
    expect(audit.data).toMatchObject({
      before: { permissions: ["ORDERS_VIEW"] },
      after: { permissions: ["ORDERS_CREATE", "ORDERS_VIEW"] },
    });
  });

  it("lehnt ein Level über 99 ab", async () => {
    const ctx = await makeCtx({ isAdmin: true });

    await expect(createRank(ctx, valid({ level: 100 }))).rejects.toThrow(ZodError);
  });
});
