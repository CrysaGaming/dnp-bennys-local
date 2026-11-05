import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { createUserWithEmployee } from "@tests/helpers/factories";

describe("writeAudit", () => {
  it("schreibt genau eine Zeile", async () => {
    const { user } = await createUserWithEmployee();
    await writeAudit(prisma, {
      actorId: user.id,
      action: "test.do",
      entity: "Test",
      entityId: "x",
      data: { a: 1 },
    });

    const rows = await prisma.auditLog.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      actorId: user.id,
      action: "test.do",
      entity: "Test",
      entityId: "x",
      data: { a: 1 },
    });
  });

  it("akzeptiert actorId null und Daten null", async () => {
    await writeAudit(prisma, { actorId: null, action: "test.leer", entity: "Test" });
    const rows = await prisma.auditLog.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.actorId).toBeNull();
    expect(rows[0]?.data).toBeNull();
  });
});
