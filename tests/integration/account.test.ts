import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { completePasswordChange } from "@/features/account/service";
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
