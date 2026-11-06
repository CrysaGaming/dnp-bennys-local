import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createCategory,
  createPriceItem,
  deleteCategory,
  getPriceList,
  setPriceItemActive,
  updatePriceItem,
} from "@/features/pricelist/service";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { createPart, createPriceItem as makeItem } from "@tests/helpers/factories";
import { makeCtx } from "@tests/helpers/factories";

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Preisliste", () => {
  it("Leistung erscheint in ihrer Kategorie", async () => {
    const ctx = await makeCtx({ permissions: ["PRICELIST_MANAGE"] });
    const category = await createCategory(ctx, { name: "Reparatur", sortOrder: 1 });
    const part = await createPart({ name: "Motoröl" });

    const item = await createPriceItem(ctx, {
      name: "Ölwechsel",
      description: "Öl und Filter",
      price: 250,
      categoryId: category.id,
      partId: part.id,
      partQuantity: 1,
      sortOrder: 10,
    });

    const list = await getPriceList(ctx);
    const section = list.find((c) => c.id === category.id);

    expect(section?.name).toBe("Reparatur");
    expect(section?.items[0]).toMatchObject({
      id: item.id,
      name: "Ölwechsel",
      price: 250,
      part: { id: part.id, name: "Motoröl" },
    });
  });

  it("gleiche Leistung in derselben Kategorie ist ein Konflikt", async () => {
    const ctx = await makeCtx({ permissions: ["PRICELIST_MANAGE"] });
    const category = await createCategory(ctx, { name: "Karosserie" });

    await createPriceItem(ctx, { name: "Lackierung", price: 500, categoryId: category.id });

    await expect(createPriceItem(ctx, { name: "Lackierung", price: 500, categoryId: category.id })).rejects.toThrow(
      ConflictError,
    );

    // Gleicher Name in einer anderen Kategorie ist ok.
    const other = await createCategory(ctx, { name: "Elektrik" });
    const second = await createPriceItem(ctx, { name: "Lackierung", price: 400, categoryId: other.id });
    expect(second.categoryId).toBe(other.id);
  });

  it("inaktive Leistungen sind nur mit Schalter dabei", async () => {
    const ctx = await makeCtx({ permissions: ["PRICELIST_MANAGE"] });
    const category = await createCategory(ctx, { name: "Reifen" });
    const item = await createPriceItem(ctx, { name: "Räderwechsel", price: 120, categoryId: category.id });

    await setPriceItemActive(ctx, item.id, false);

    const without = await getPriceList(ctx);
    const withInactive = await getPriceList(ctx, { includeInactive: true });

    const plain = without.find((c) => c.id === category.id);
    const shown = withInactive.find((c) => c.id === category.id);

    expect(plain?.items).toHaveLength(0);
    expect(shown?.items).toHaveLength(1);
    expect(shown?.items[0]?.active).toBe(false);
  });

  it("Kategorie mit Leistungen darf nicht gelöscht werden", async () => {
    const ctx = await makeCtx({ permissions: ["PRICELIST_MANAGE"] });
    const category = await createCategory(ctx, { name: "Bremsen" });
    await createPriceItem(ctx, { name: "Bremscheck", price: 90, categoryId: category.id });

    await expect(deleteCategory(ctx, category.id)).rejects.toThrow(
      "Die Kategorie enthält noch Leistungen.",
    );

    // Ohne Leistungen geht es.
    const empty = await createCategory(ctx, { name: "Lackierung Test" });
    await deleteCategory(ctx, empty.id);

    expect(await prisma.priceCategory.count({ where: { id: empty.id } })).toBe(0);
  });

  it("Lesend ist die Preisliste für alle, Schreiben nur mit Recht", async () => {
    const ctx = await makeCtx({ permissions: [] });

    const list = await getPriceList(ctx);
    expect(Array.isArray(list)).toBe(true);

    await expect(createCategory(ctx, { name: "Ohne Recht" })).rejects.toThrow(ForbiddenError);

    const managed = await makeCtx({ permissions: ["PRICELIST_MANAGE"] });
    const category = await createCategory(managed, { name: "Zahnräder" });
    const item = await makeItem({ name: "Zahnrad", price: 30, categoryId: category.id });

    await expect(createPriceItem(ctx, { name: "Zahnrad", price: 30, categoryId: category.id })).rejects.toThrow(
      ForbiddenError,
    );
    await expect(updatePriceItem(ctx, item.id, { name: "Zahnrad", price: 40, categoryId: category.id })).rejects.toThrow(
      ForbiddenError,
    );
    await expect(setPriceItemActive(ctx, item.id, false)).rejects.toThrow(ForbiddenError);
  });

  it("Audit für eine neue Leistung", async () => {
    const ctx = await makeCtx({ permissions: ["PRICELIST_MANAGE"] });
    const category = await createCategory(ctx, { name: "Klima" });
    const item = await createPriceItem(ctx, { name: "Kältestest", price: 150, categoryId: category.id });

    const audit = await prisma.auditLog.findFirst({ where: { action: "priceitem.create" } });
    expect(audit).not.toBeNull();
    expect(audit?.entityId).toBe(item.id);
  });

  it("Leistung ohne Kategorie ist nicht findbar", async () => {
    const ctx = await makeCtx({ permissions: ["PRICELIST_MANAGE"] });

    await expect(createPriceItem(ctx, { name: "Ohne Kategorie", price: 10, categoryId: "fehlt" })).rejects.toThrow(
      NotFoundError,
    );
  });

  it("Sortierung folgt sortOrder und dann dem Namen", async () => {
    const ctx = await makeCtx({ permissions: ["PRICELIST_MANAGE"] });
    const category = await createCategory(ctx, { name: "Getriebe", sortOrder: 2 });

    await createPriceItem(ctx, { name: "Ölwechsel", price: 100, categoryId: category.id, sortOrder: 20 });
    await createPriceItem(ctx, { name: "Ausjustieren", price: 120, categoryId: category.id, sortOrder: 10 });

    const list = await getPriceList(ctx);
    const section = list.find((c) => c.id === category.id);

    expect(section?.items.map((i) => i.name)).toEqual(["Ausjustieren", "Ölwechsel"]);
  });
});
