import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { assertPermission } from "@/lib/permissions";
import { ConflictError, NotFoundError } from "@/lib/errors";
import type { SessionContext } from "@/lib/session-types";
import { isLowStock } from "./low-stock";
import { bookingSchema, partSchema } from "./schemas";
import { bookStock } from "./stock";

const FIELD = { name: "name", sku: "sku" } as const;

function conflict(e: unknown): ConflictError | null {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== "P2002") return null;

  // Prisma 7 mit Driver-Adapter: kein `meta.target`, sondern der Index aus der
  // Originalmeldung. Beides wird akzeptiert, damit die Zuordnung nicht kippt.
  const index =
    (e.meta as { driverAdapterError?: { cause?: { constraint?: { index?: string } } } })?.driverAdapterError
      ?.cause?.constraint?.index ?? "";
  const target = (e.meta as { target?: string[] })?.target ?? [];

  if (index === "part_sku_key" || target.includes("sku")) {
    return new ConflictError("sku", "Diese Artikelnummer gibt es schon.");
  }

  return new ConflictError("name", "Dieses Teil gibt es schon.");
}

function toRow(part: {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  stock: number;
  minStock: number;
  purchasePrice: number;
}): PartRow {
  return { ...part, isLow: isLowStock(part) };
}

export type PartRow = {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  stock: number;
  minStock: number;
  purchasePrice: number;
  isLow: boolean;
};

export async function listParts(ctx: SessionContext): Promise<PartRow[]> {
  assertPermission(ctx, "INVENTORY_VIEW");

  const parts = await prisma.part.findMany({ orderBy: { name: "asc" } });

  return parts.map(toRow);
}

export async function createPart(ctx: SessionContext, input: unknown): Promise<PartRow> {
  assertPermission(ctx, "INVENTORY_MANAGE");

  const data = partSchema.parse(input);

  try {
    const part = await prisma.$transaction(async (tx) => {
      const created = await tx.part.create({ data });
      await writeAudit(tx, {
        actorId: ctx.userId,
        action: "inventory.part.create",
        entity: "part",
        entityId: created.id,
        data: { name: created.name, sku: created.sku, unit: created.unit },
      });
      return created;
    });

    return toRow(part);
  } catch (e) {
    const c = conflict(e);
    if (c) throw c;
    throw e;
  }
}

/** Der Bestand wird hier nicht geschrieben – er läuft ausschließlich über `bookStock`. */
export async function updatePart(ctx: SessionContext, id: string, input: unknown): Promise<PartRow> {
  assertPermission(ctx, "INVENTORY_MANAGE");

  const data = partSchema.parse(input);

  try {
    const part = await prisma.$transaction(async (tx) => {
      const updated = await tx.part.update({ where: { id }, data });
      await writeAudit(tx, {
        actorId: ctx.userId,
        action: "inventory.part.update",
        entity: "part",
        entityId: updated.id,
        data: { name: updated.name, minStock: updated.minStock },
      });
      return updated;
    });

    return toRow(part);
  } catch (e) {
    const c = conflict(e);
    if (c) throw c;
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      throw new NotFoundError("Teil nicht gefunden.");
    }
    throw e;
  }
}

export async function bookMovement(ctx: SessionContext, input: unknown) {
  assertPermission(ctx, "INVENTORY_MANAGE");

  const booking = bookingSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const part = await tx.part.findUnique({ where: { id: booking.partId } });
    if (!part) throw new NotFoundError("Teil nicht gefunden.");

    // Zugang und Verlust wirken in den Bestand hinein, Korrektur in beide Richtungen.
    const delta = booking.kind === "LOSS" ? -booking.amount : booking.amount;

    const after = await bookStock(tx, {
      partId: booking.partId,
      delta,
      reason: booking.kind,
      employeeId: ctx.employeeId,
      note: booking.note ?? null,
    });

    await writeAudit(tx, {
      actorId: ctx.userId,
      action: "inventory.booking",
      entity: "part",
      entityId: booking.partId,
      data: { delta, reason: booking.kind, note: booking.note ?? null },
    });

    return { stock: after.stock };
  });
}

export async function listMovements(ctx: SessionContext, partId: string) {
  assertPermission(ctx, "INVENTORY_VIEW");

  return prisma.stockMovement.findMany({
    where: { partId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}
