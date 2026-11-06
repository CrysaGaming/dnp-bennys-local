import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { assertPermission } from "@/lib/permissions";
import { BusinessRuleError, ConflictError, NotFoundError } from "@/lib/errors";
import type { SessionContext } from "@/lib/session-types";
import { categorySchema, priceItemSchema, type CategoryInput, type PriceItemInput } from "./schemas";

export type PriceListItemRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  categoryId: string;
  part: { id: string; name: string } | null;
  partQuantity: number;
  active: boolean;
  sortOrder: number;
};

export type PriceListView = Array<{
  id: string;
  name: string;
  sortOrder: number;
  items: PriceListItemRow[];
}>;

function conflict(e: unknown): ConflictError | null {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== "P2002") return null;

  // Prisma 7 mit Driver-Adapter: kein `meta.target`, sondern der Index aus der
  // Originalmeldung. Beides wird akzeptiert, damit die Zuordnung nicht kippt.
  const index =
    (e.meta as { driverAdapterError?: { cause?: { constraint?: { index?: string } } } })?.driverAdapterError
      ?.cause?.constraint?.index ?? "";
  const target = (e.meta as { target?: string[] })?.target ?? [];

  if (index === "price_list_item_categoryId_name_key") {
    return new ConflictError("name", "Diese Leistung gibt es in der Kategorie schon.");
  }

  if (index === "price_category_name_key") {
    return new ConflictError("name", "Den Kategoriennamen gibt es schon.");
  }

  if (target.includes("name")) {
    return new ConflictError("name", "Den Namen gibt es schon.");
  }

  return null;
}

/** Die Preisliste ist für alle Mitarbeiter lesbar (Spec 5.7). */
export async function getPriceList(
  ctx: SessionContext,
  opts: { includeInactive?: boolean } = {},
): Promise<PriceListView> {
  const categories = await prisma.priceCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      items: {
        where: opts.includeInactive ? undefined : { active: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: { part: { select: { id: true, name: true } } },
      },
    },
  });

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    sortOrder: c.sortOrder,
    items: c.items.map((i) => ({
      id: i.id,
      name: i.name,
      description: i.description,
      price: i.price,
      categoryId: i.categoryId,
      part: i.part ? { id: i.part.id, name: i.part.name } : null,
      partQuantity: i.partQuantity,
      active: i.active,
      sortOrder: i.sortOrder,
    })),
  }));
}

export async function createCategory(ctx: SessionContext, input: CategoryInput) {
  assertPermission(ctx, "PRICELIST_MANAGE");

  const data = categorySchema.parse(input);

  try {
    const category = await prisma.$transaction(async (tx) => {
      const created = await tx.priceCategory.create({ data });
      await writeAudit(tx, {
        actorId: ctx.userId,
        action: "pricecategory.create",
        entity: "price_category",
        entityId: created.id,
        data: { name: created.name, sortOrder: created.sortOrder },
      });
      return created;
    });

    return category;
  } catch (e) {
    const c = conflict(e);
    if (c) throw c;
    throw e;
  }
}

export async function deleteCategory(ctx: SessionContext, id: string): Promise<void> {
  assertPermission(ctx, "PRICELIST_MANAGE");

  const category = await prisma.priceCategory.findUnique({
    where: { id },
    include: { _count: { select: { items: true } } },
  });

  if (!category) throw new NotFoundError("Kategorie nicht gefunden.");

  if (category._count.items > 0) {
    throw new BusinessRuleError("Die Kategorie enthält noch Leistungen.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.priceCategory.delete({ where: { id } });
    await writeAudit(tx, {
      actorId: ctx.userId,
      action: "pricecategory.delete",
      entity: "price_category",
      entityId: id,
      data: { name: category.name },
    });
  });
}

export async function createPriceItem(ctx: SessionContext, input: PriceItemInput) {
  assertPermission(ctx, "PRICELIST_MANAGE");

  const data = priceItemSchema.parse(input);

  const category = await prisma.priceCategory.findUnique({ where: { id: data.categoryId } });
  if (!category) throw new NotFoundError("Kategorie nicht gefunden.");

  if (data.partId) {
    const part = await prisma.part.findUnique({ where: { id: data.partId } });
    if (!part) throw new NotFoundError("Teil nicht gefunden.");
  }

  try {
    const item = await prisma.$transaction(async (tx) => {
      const created = await tx.priceListItem.create({ data });
      await writeAudit(tx, {
        actorId: ctx.userId,
        action: "priceitem.create",
        entity: "price_list_item",
        entityId: created.id,
        data: { name: created.name, price: created.price, categoryId: created.categoryId },
      });
      return created;
    });

    return item;
  } catch (e) {
    const c = conflict(e);
    if (c) throw c;
    throw e;
  }
}

export async function updatePriceItem(ctx: SessionContext, id: string, input: PriceItemInput) {
  assertPermission(ctx, "PRICELIST_MANAGE");

  const data = priceItemSchema.parse(input);

  const category = await prisma.priceCategory.findUnique({ where: { id: data.categoryId } });
  if (!category) throw new NotFoundError("Kategorie nicht gefunden.");

  try {
    const item = await prisma.$transaction(async (tx) => {
      const updated = await tx.priceListItem.update({ where: { id }, data });
      await writeAudit(tx, {
        actorId: ctx.userId,
        action: "priceitem.update",
        entity: "price_list_item",
        entityId: updated.id,
        data: { name: updated.name, price: updated.price },
      });
      return updated;
    });

    return item;
  } catch (e) {
    const c = conflict(e);
    if (c) throw c;
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      throw new NotFoundError("Leistung nicht gefunden.");
    }
    throw e;
  }
}

export async function setPriceItemActive(ctx: SessionContext, id: string, active: boolean) {
  assertPermission(ctx, "PRICELIST_MANAGE");

  const item = await prisma.$transaction(async (tx) => {
    const updated = await tx.priceListItem.update({ where: { id }, data: { active } });
    await writeAudit(tx, {
      actorId: ctx.userId,
      action: "priceitem.active",
      entity: "price_list_item",
      entityId: updated.id,
      data: { active },
    });
    return updated;
  });

  return item;
}
