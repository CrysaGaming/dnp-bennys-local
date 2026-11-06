import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { listAudit } from "@/features/audit/queries";
import { decodeCursor } from "@/features/audit/cursor";
import { ForbiddenError } from "@/lib/errors";
import { makeCtx } from "@tests/helpers/factories";
import type { Permission } from "@/generated/prisma/enums";

afterAll(async () => {
  await prisma.$disconnect();
});

async function seed(actorId: string, count: number) {
  for (let i = 0; i < count; i++) {
    await prisma.auditLog.create({
      data: {
        actorId,
        action: `test.${i}`,
        entity: "TestEntity",
        entityId: `e${i}`,
        createdAt: new Date(2026, 10, 1, 0, i),
      },
    });
  }
}

describe("Audit-Ansicht", () => {
  it("Seite 1 hat 50 und einen Cursor, Seite 3 hat 20 und keinen mehr", async () => {
    const ctx = await makeCtx({ permissions: ["AUDIT_VIEW"] });
    await seed(ctx.userId, 120);

    const page1 = await listAudit(ctx, {});
    expect(page1.rows).toHaveLength(50);
    expect(page1.nextCursor).not.toBeNull();

    const page2 = await listAudit(ctx, { cursor: page1.nextCursor! });
    expect(page2.rows).toHaveLength(50);
    expect(page2.nextCursor).not.toBeNull();

    const page3 = await listAudit(ctx, { cursor: page2.nextCursor! });
    expect(page3.rows).toHaveLength(20);
    expect(page3.nextCursor).toBeNull();

    const all = [...page1.rows, ...page2.rows, ...page3.rows].map((row) => row.id);
    expect(new Set(all).size).toBe(120);
  });

  it("der Cursor zeigt auf den letzten Eintrag der Seite", async () => {
    const ctx = await makeCtx({ permissions: ["AUDIT_VIEW"] });
    await seed(ctx.userId, 3);

    const page = await listAudit(ctx, { limit: 2 });
    const decoded = decodeCursor(page.nextCursor!);

    expect(decoded).toEqual({ createdAt: page.rows[1]!.createdAt, id: page.rows[1]!.id });
  });

  it("Filter nach Objekt", async () => {
    const ctx = await makeCtx({ permissions: ["AUDIT_VIEW"] });
    await prisma.auditLog.create({ data: { actorId: ctx.userId, action: "resource.create", entity: "Resource", entityId: "r1" } });
    await seed(ctx.userId, 4);

    const rows = (await listAudit(ctx, { entity: "Resource" })).rows;
    expect(rows).toHaveLength(1);
    expect(rows[0]!.entity).toBe("Resource");
  });

  it("ohne AUDIT_VIEW darf niemand reinschauen", async () => {
    const ctx = await makeCtx({ permissions: [] as Permission[] });
    await expect(listAudit(ctx, {})).rejects.toThrow(ForbiddenError);
  });
});
