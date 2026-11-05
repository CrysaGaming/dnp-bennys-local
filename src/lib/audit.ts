import { Prisma, type PrismaClient } from "@/generated/prisma/client";

export type AuditDb = Prisma.TransactionClient | PrismaClient;

export type AuditEntry = {
  actorId: string | null;
  action: string;
  entity: string;
  entityId?: string;
  data?: Prisma.InputJsonValue;
};

/** Audit-Eintrag schreiben – immer in derselben Transaktion wie die Änderung (Spec 4.4). */
export async function writeAudit(db: AuditDb, entry: AuditEntry): Promise<void> {
  await db.auditLog.create({
    data: {
      actorId: entry.actorId,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId ?? null,
      data: entry.data ?? Prisma.JsonNull,
    },
  });
}
