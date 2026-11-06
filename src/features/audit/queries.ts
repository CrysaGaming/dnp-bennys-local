import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { assertPermission } from "@/lib/permissions";
import type { SessionContext } from "@/lib/session-types";
import { decodeCursor, encodeCursor } from "./cursor";

export const DEFAULT_AUDIT_LIMIT = 50;

export type AuditRow = {
  id: string;
  actorId: string | null;
  actorName: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  data: unknown;
  createdAt: Date;
};

export type AuditQuery = {
  entity?: string;
  actorId?: string;
  from?: Date;
  to?: Date;
  cursor?: string;
  limit?: number;
};

/**
 * Audit-Log seitenweise (Spec 5.13). Keyset über `createdAt desc, id desc` – kein Offset, damit
 * die Seiten sich nicht überlappen, wenn während des Lesens neue Einträge entstehen.
 */
export async function listAudit(
  ctx: SessionContext,
  q: AuditQuery = {},
): Promise<{ rows: AuditRow[]; nextCursor: string | null }> {
  assertPermission(ctx, "AUDIT_VIEW");

  const limit = q.limit ?? DEFAULT_AUDIT_LIMIT;
  const cursor = q.cursor ? decodeCursor(q.cursor) : null;

  const conditions: Prisma.AuditLogWhereInput[] = [];

  if (q.entity) conditions.push({ entity: q.entity });
  if (q.actorId) conditions.push({ actorId: q.actorId });
  if (q.from) conditions.push({ createdAt: { gte: q.from } });
  if (q.to) conditions.push({ createdAt: { lte: q.to } });

  if (cursor) {
    conditions.push({
      OR: [
        { createdAt: { lt: cursor.createdAt } },
        { AND: [{ createdAt: cursor.createdAt }, { id: { lt: cursor.id } }] },
      ],
    });
  }

  const found = await prisma.auditLog.findMany({
    where: conditions.length > 0 ? { AND: conditions } : {},
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    include: { actor: { select: { name: true } } },
  });

  const rows = found.slice(0, limit).map((row) => ({
    id: row.id,
    actorId: row.actorId,
    actorName: row.actor?.name ?? null,
    action: row.action,
    entity: row.entity,
    entityId: row.entityId,
    data: row.data,
    createdAt: row.createdAt,
  }));

  const hasMore = found.length > limit;
  const last = rows[rows.length - 1];

  return {
    rows,
    nextCursor: hasMore && last ? encodeCursor({ createdAt: last.createdAt, id: last.id }) : null,
  };
}
