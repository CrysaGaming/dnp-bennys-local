import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import type { SessionContext } from "@/lib/session-types";

/**
 * Nach dem eigentlichen Passwortwechsel über Better Auth (Spec 3.2):
 * das Zwangs-Flag erledigen und auditieren.
 */
export async function completePasswordChange(ctx: SessionContext): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.employee.update({
      where: { id: ctx.employeeId },
      data: { mustChangePassword: false },
    });

    await writeAudit(tx, {
      actorId: ctx.userId,
      action: "account.password_changed",
      entity: "employee",
      entityId: ctx.employeeId,
    });
  });
}
