import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { assertPermission } from "@/lib/permissions";
import { ConflictError, NotFoundError } from "@/lib/errors";
import type { SessionContext } from "@/lib/session-types";
import type { ResourceCategory } from "@/generated/prisma/enums";
import { resourceInputSchema } from "./schemas";

export type ResourceRow = {
  id: string;
  name: string;
  category: ResourceCategory;
  weightGrams: number;
  exportPrice: number;
  note: string | null;
  createdById: string | null;
};

const DUPLICATE = "Diese Ressource gibt es schon";

function conflict(e: unknown): ConflictError | null {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== "P2002") return null;

  // Prisma 7 mit Driver-Adapter: kein `meta.target`, sondern der Index aus der
  // Originalmeldung. Beides wird akzeptiert, damit die Zuordnung nicht kippt.
  const index =
    (e.meta as { driverAdapterError?: { cause?: { constraint?: { index?: string } } } })?.driverAdapterError
      ?.cause?.constraint?.index ?? "";

  if (index === "resource_name_ci_unique") {
    return new ConflictError("name", DUPLICATE);
  }

  return null;
}

/**
 * Name ist case-insensitiv unique (Migration: lower(name)). Die Vorprüfung gibt das Feld
 * für die Fehlermeldung, der Unique-Index ist der Rückfall für den Fall, dass zwei zur
 * selben Zeit anlegen.
 */
async function assertFreeName(
  tx: Prisma.TransactionClient,
  name: string,
  selfId?: string,
): Promise<void> {
  const existing = await tx.resource.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      ...(selfId ? { id: { not: selfId } } : {}),
    },
  });

  if (existing) throw new ConflictError("name", DUPLICATE);
}

export async function listResources(ctx: SessionContext): Promise<ResourceRow[]> {
  assertPermission(ctx, "RESOURCES_VIEW");

  const rows = await prisma.resource.findMany({ orderBy: { name: "asc" } });

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    weightGrams: r.weightGrams,
    exportPrice: r.exportPrice,
    note: r.note,
    createdById: r.createdById,
  }));
}

export async function createResource(ctx: SessionContext, input: unknown) {
  assertPermission(ctx, "RESOURCES_MANAGE");

  const data = resourceInputSchema.parse(input);

  try {
    const row = await prisma.$transaction(async (tx) => {
      await assertFreeName(tx, data.name);

      const created = await tx.resource.create({
        data: { ...data, createdById: ctx.employeeId },
      });

      await writeAudit(tx, {
        actorId: ctx.userId,
        action: "resource.create",
        entity: "resource",
        entityId: created.id,
        data: {
          after: {
            name: created.name,
            category: created.category,
            weightGrams: created.weightGrams,
            exportPrice: created.exportPrice,
          },
        },
      });

      return created;
    });

    return row;
  } catch (e) {
    const c = conflict(e);
    if (c) throw c;
    throw e;
  }
}

/** Umbenennen auf den eigenen Namen in anderer Schreibweise ist erlaubt. */
export async function updateResource(ctx: SessionContext, id: string, input: unknown) {
  assertPermission(ctx, "RESOURCES_MANAGE");

  const data = resourceInputSchema.parse(input);

  try {
    const row = await prisma.$transaction(async (tx) => {
      const existing = await tx.resource.findUnique({ where: { id } });
      if (!existing) throw new NotFoundError("Ressource nicht gefunden.");

      await assertFreeName(tx, data.name, id);

      const updated = await tx.resource.update({ where: { id }, data });

      await writeAudit(tx, {
        actorId: ctx.userId,
        action: "resource.update",
        entity: "resource",
        entityId: updated.id,
        data: {
          before: {
            name: existing.name,
            category: existing.category,
            weightGrams: existing.weightGrams,
            exportPrice: existing.exportPrice,
          },
          after: {
            name: updated.name,
            category: updated.category,
            weightGrams: updated.weightGrams,
            exportPrice: updated.exportPrice,
          },
        },
      });

      return updated;
    });

    return row;
  } catch (e) {
    const c = conflict(e);
    if (c) throw c;
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      throw new NotFoundError("Ressource nicht gefunden.");
    }
    throw e;
  }
}

/** Ressource ist die Ausnahme vom Verbot des harten Löschens (Spec 5.8). */
export async function deleteResource(ctx: SessionContext, id: string): Promise<void> {
  assertPermission(ctx, "RESOURCES_MANAGE");

  await prisma.$transaction(async (tx) => {
    const existing = await tx.resource.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Ressource nicht gefunden.");

    await tx.resource.delete({ where: { id } });

    await writeAudit(tx, {
      actorId: ctx.userId,
      action: "resource.delete",
      entity: "resource",
      entityId: id,
      data: {
        before: {
          name: existing.name,
          category: existing.category,
          weightGrams: existing.weightGrams,
          exportPrice: existing.exportPrice,
        },
      },
    });
  });
}
