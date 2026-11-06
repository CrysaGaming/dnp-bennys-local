import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { assertPermission, hasPermission, outranks, withImplied } from "@/lib/permissions";
import { BusinessRuleError, ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import type { Permission } from "@/generated/prisma/enums";
import type { SessionContext } from "@/lib/session-types";
import { rankSchema, type RankInput } from "./schemas";

export type RankRow = {
  id: string;
  name: string;
  level: number;
  color: string;
  hourlyWage: number;
  permissions: Permission[];
  isSystem: boolean;
  employeeCount: number;
};

type RankLike = {
  id: string;
  name: string;
  level: number;
  color: string;
  hourlyWage: number;
  permissions: Permission[];
  isSystem: boolean;
};

function toRow(rank: RankLike, employeeCount: number): RankRow {
  return { ...rank, employeeCount };
}

/** Ränge sehen darf man mit RANKS_MANAGE oder EMPLOYEES_VIEW (Spec 5.9). */
export async function listRanks(ctx: SessionContext): Promise<RankRow[]> {
  if (!hasPermission(ctx, "RANKS_MANAGE") && !hasPermission(ctx, "EMPLOYEES_VIEW")) {
    throw new ForbiddenError();
  }

  const ranks = await prisma.rank.findMany({
    orderBy: { level: "desc" },
    include: { _count: { select: { employees: true } } },
  });

  return ranks.map((rank) => toRow(rank, rank._count.employees));
}

/** Nur Rechte, die man selbst hat, und nur Level unter dem eigenen (Spec 5.9). */
function assertCanGrant(ctx: SessionContext, permissions: Permission[]): void {
  for (const p of permissions) {
    if (!hasPermission(ctx, p)) {
      throw new BusinessRuleError("Du kannst nur Rechte vergeben, die du selbst hast.");
    }
  }
}

function assertLowerLevel(ctx: SessionContext, level: number): void {
  if (!outranks(ctx, level)) {
    throw new BusinessRuleError("Level muss unter deinem eigenen liegen.");
  }
}

function conflict(e: unknown): ConflictError | null {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== "P2002") return null;

  // Prisma 7 mit Driver-Adapter: kein `meta.target`, sondern der Index aus der
  // Originalmeldung. Beides wird akzeptiert, damit die Zuordnung nicht kippt.
  const index =
    (e.meta as { driverAdapterError?: { cause?: { constraint?: { index?: string } } } })?.driverAdapterError
      ?.cause?.constraint?.index ?? "";
  const target = (e.meta as { target?: string[] })?.target ?? [];

  if (index === "rank_level_key" || target.includes("level")) {
    return new ConflictError("level", "Dieses Level ist schon vergeben");
  }

  return new ConflictError("name", "Diesen Namen gibt es schon");
}

export async function createRank(ctx: SessionContext, input: unknown): Promise<RankRow> {
  assertPermission(ctx, "RANKS_MANAGE");

  const data = rankSchema.parse(input);
  assertLowerLevel(ctx, data.level);
  assertCanGrant(ctx, data.permissions);

  const permissions = withImplied(data.permissions);

  try {
    const rank = await prisma.$transaction(async (tx) => {
      const created = await tx.rank.create({
        data: {
          name: data.name,
          level: data.level,
          color: data.color,
          hourlyWage: data.hourlyWage,
          permissions,
        },
      });

      await writeAudit(tx, {
        actorId: ctx.userId,
        action: "rank.create",
        entity: "rank",
        entityId: created.id,
        data: { name: created.name, level: created.level, permissions: created.permissions },
      });

      return created;
    });

    return toRow(rank, 0);
  } catch (e) {
    const c = conflict(e);
    if (c) throw c;
    throw e;
  }
}

export async function updateRank(ctx: SessionContext, id: string, input: unknown): Promise<RankRow> {
  assertPermission(ctx, "RANKS_MANAGE");

  const data = rankSchema.parse(input);

  const existing = await prisma.rank.findUnique({
    where: { id },
    include: { _count: { select: { employees: true } } },
  });
  if (!existing) throw new NotFoundError();

  if (existing.isSystem) throw new BusinessRuleError("Der Admin-Rang ist geschützt.");

  assertLowerLevel(ctx, existing.level);
  assertLowerLevel(ctx, data.level);
  assertCanGrant(ctx, data.permissions);

  const permissions = withImplied(data.permissions);

  try {
    const rank = await prisma.$transaction(async (tx) => {
      const updated = await tx.rank.update({ where: { id }, data: { ...data, permissions } });

      await writeAudit(tx, {
        actorId: ctx.userId,
        action: "rank.update",
        entity: "rank",
        entityId: id,
        data: {
          before: { name: existing.name, level: existing.level, permissions: existing.permissions },
          after: { name: updated.name, level: updated.level, permissions: updated.permissions },
        },
      });

      return updated;
    });

    return toRow(rank, existing._count.employees);
  } catch (e) {
    const c = conflict(e);
    if (c) throw c;
    throw e;
  }
}

/** Kein Hard-Delete – ein Rang mit Mitarbeitern bleibt (AGENTS.md, Spec 7.5). */
export async function deleteRank(ctx: SessionContext, id: string): Promise<void> {
  assertPermission(ctx, "RANKS_MANAGE");

  const rank = await prisma.rank.findUnique({ where: { id } });
  if (!rank) throw new NotFoundError();

  if (rank.isSystem) throw new BusinessRuleError("Der Admin-Rang ist geschützt.");
  assertLowerLevel(ctx, rank.level);

  const count = await prisma.employee.count({ where: { rankId: id } });
  if (count > 0) {
    throw new BusinessRuleError(`Diesem Rang sind noch ${count} Mitarbeiter zugeordnet.`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.rank.delete({ where: { id } });

    await writeAudit(tx, {
      actorId: ctx.userId,
      action: "rank.delete",
      entity: "rank",
      entityId: id,
      data: { name: rank.name, level: rank.level },
    });
  });
}

export type { RankInput };

/** Ränge, die der Kontext selbst verwalten darf – für die Auswahl im Mitarbeiterformular. */
export async function ranksBelowOwn(ctx: SessionContext): Promise<RankRow[]> {
  assertPermission(ctx, "RANKS_MANAGE");

  const ranks = await listRanks(ctx);

  return ranks.filter((rank) => rank.isSystem || rank.level < ctx.rank.level);
}
