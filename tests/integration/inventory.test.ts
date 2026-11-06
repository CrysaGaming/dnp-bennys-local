import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { bookMovement, createPart, listParts, updatePart } from "@/features/inventory/service";
import { bookingSchema, partSchema } from "@/features/inventory/schemas";
import { ConflictError, ForbiddenError, InsufficientStockError } from "@/lib/errors";
import { createEmployeeForRank, createPart as makePart, makeCtx } from "@tests/helpers/factories";

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Lager", () => {
  it("Zugang erhöht Bestand und schreibt Bewegung und Audit", async () => {
    const ctx = await makeCtx({ permissions: ["INVENTORY_MANAGE"] });
    const part = await makePart({ name: "Bremsscheibe", minStock: 5 });

    await bookMovement(ctx, { partId: part.id, kind: "PURCHASE", amount: 3 });

    const stored = await prisma.part.findUniqueOrThrow({ where: { id: part.id } });
    expect(stored.stock).toBe(3);

    const movements = await prisma.stockMovement.findMany({ where: { partId: part.id } });
    expect(movements).toHaveLength(1);
    expect(movements[0]).toMatchObject({ delta: 3, reason: "PURCHASE", employeeId: ctx.employeeId });

    const audit = await prisma.auditLog.findMany({ where: { action: "inventory.booking" } });
    expect(audit.length).toBeGreaterThanOrEqual(1);
  });

  it("Verlust über den Bestand scheitert ohne Bewegung", async () => {
    const ctx = await makeCtx({ permissions: ["INVENTORY_MANAGE"] });
    const part = await makePart({ name: "Zündkerze", stock: 3 });

    await expect(
      bookMovement(ctx, { partId: part.id, kind: "LOSS", amount: 10, note: "Diebstahl" }),
    ).rejects.toThrow(InsufficientStockError);

    const stored = await prisma.part.findUniqueOrThrow({ where: { id: part.id } });
    expect(stored.stock).toBe(3);
    expect(await prisma.stockMovement.count({ where: { partId: part.id } })).toBe(0);
  });

  it("zwei gleichzeitige Abbuchungen: genau eine bekommt den Zuschlag", async () => {
    const ctx = await makeCtx({ permissions: ["INVENTORY_MANAGE"] });
    const part = await makePart({ name: "Reifen", stock: 5 });

    const results = await Promise.allSettled([
      bookMovement(ctx, { partId: part.id, kind: "LOSS", amount: 3, note: "_parallel_a" }),
      bookMovement(ctx, { partId: part.id, kind: "LOSS", amount: 3, note: "parallel_b" }),
    ]);

    const ok = results.filter((r) => r.status === "fulfilled");
    const failed = results.filter((r) => r.status === "rejected");

    expect(ok).toHaveLength(1);
    expect(failed).toHaveLength(1);
    expect((failed[0] as PromiseRejectedResult).reason).toBeInstanceOf(InsufficientStockError);

    const stored = await prisma.part.findUniqueOrThrow({ where: { id: part.id } });
    expect(stored.stock).toBe(2);
    expect(await prisma.stockMovement.count({ where: { partId: part.id } })).toBe(1);
  });

  it("Korrektur bucht mit dem eingegebenen Vorzeichen", async () => {
    const ctx = await makeCtx({ permissions: ["INVENTORY_MANAGE"] });
    const part = await makePart({ name: "Schrauben", stock: 10 });

    await bookMovement(ctx, { partId: part.id, kind: "CORRECTION", amount: -4, note: "Inventur" });

    const stored = await prisma.part.findUniqueOrThrow({ where: { id: part.id } });
    expect(stored.stock).toBe(6);

    const movement = await prisma.stockMovement.findFirstOrThrow({ where: { partId: part.id } });
    expect(movement.reason).toBe("CORRECTION");
    expect(movement.delta).toBe(-4);
    expect(movement.note).toBe("Inventur");
  });

  it("Ohne Notiz ist eine Korrektur oder ein Verlust falsch", () => {
    expect(
      bookingSchema.safeParse({ partId: "x", kind: "CORRECTION", amount: -1 }).success,
    ).toBe(false);
    expect(bookingSchema.safeParse({ partId: "x", kind: "CORRECTION", amount: -1, note: "ab" }).success).toBe(
      false,
    );

    const ok = bookingSchema.safeParse({ partId: "x", kind: "CORRECTION", amount: -1, note: "Inventur" });
    expect(ok.success).toBe(true);
  });

  it("Ein manuell gewählter ORDER_USAGE ist nicht buchbar", () => {
    const parsed = bookingSchema.safeParse({ partId: "x", kind: "ORDER_USAGE", amount: 1, note: "Auftrag" });
    expect(parsed.success).toBe(false);
  });

  it("Ohne INVENTORY_MANAGE ist jede Buchung verboten", async () => {
    const ctx = await makeCtx({ permissions: ["INVENTORY_VIEW"] });
    const part = await makePart({ name: "Blickdicht", stock: 1 });

    await expect(bookMovement(ctx, { partId: part.id, kind: "PURCHASE", amount: 1 })).rejects.toThrow(
      ForbiddenError,
    );
    await expect(createPart(ctx, { name: "Neues Teil" })).rejects.toThrow(ForbiddenError);
    await expect(updatePart(ctx, part.id, { name: "umbenannt" })).rejects.toThrow(ForbiddenError);

    // Sehen darf er dagegen – nur schreiben nicht.
    const rows = await listParts(ctx);
    expect(rows.some((r) => r.id === part.id)).toBe(true);
  });

  it("Der Bestand lässt sich nicht direkt über das Teil ändern", async () => {
    const ctx = await makeCtx({ permissions: ["INVENTORY_MANAGE"] });
    const part = await makePart({ name: "Filter", stock: 2, minStock: 4 });

    // Ein an der Schema-Stelle abgelehntes Feld: Teil-Eingabe kennt keinen Bestand.
    const parsed = partSchema.parse({ name: "Filter", minStock: 6, stock: 999 });
    expect("stock" in parsed).toBe(false);

    await updatePart(ctx, part.id, { name: "Ölfilter", minStock: 6 });

    const stored = await prisma.part.findUniqueOrThrow({ where: { id: part.id } });
    expect(stored.stock).toBe(2);
    expect(stored.minStock).toBe(6);
  });

  it("Knapp wird in der Liste markiert", async () => {
    const ctx = await makeCtx({ permissions: ["INVENTORY_VIEW"] });
    const part = await makePart({ name: "Bremsbelag", stock: 1, minStock: 3 });

    const rows = await listParts(ctx);
    const row = rows.find((r) => r.id === part.id);

    expect(row?.isLow).toBe(true);
  });

  it("Doppelter Name ist ein Konflikt, gleiche SKU ebenfalls", async () => {
    const ctx = await makeCtx({ permissions: ["INVENTORY_MANAGE"] });
    const first = await createPart(ctx, { name: "Schaltgestänge", sku: "SG-1" });

    await expect(createPart(ctx, { name: "Schaltgestänge" })).rejects.toThrow(ConflictError);
    await expect(createPart(ctx, { name: "Anderer Name", sku: "SG-1" })).rejects.toThrow(ConflictError);

    expect(first.name).toBe("Schaltgestänge");
  });

  it("Ein Teil mit Bewegungen darf nicht gelöscht werden", async () => {
    const ctx = await makeCtx({ permissions: ["INVENTORY_MANAGE"] });
    const part = await makePart({ name: "Ventil", stock: 2 });
    await bookMovement(ctx, { partId: part.id, kind: "PURCHASE", amount: 1 });

    await expect(prisma.part.delete({ where: { id: part.id } })).rejects.toThrow();
  });

  it("Der Autor einer Bewegung ist der Mitarbeiter, nicht die Seed-Rolle", async () => {
    const ctx = await makeCtx({ permissions: ["INVENTORY_VIEW", "INVENTORY_MANAGE"] });
    const employee = await createEmployeeForRank(ctx.rank.id);
    const asEmployee = { ...ctx, employeeId: employee.id };
    const part = await makePart({ name: "Dichtung", stock: 0 });

    await bookMovement(asEmployee, { partId: part.id, kind: "PURCHASE", amount: 5 });

    const movement = await prisma.stockMovement.findFirstOrThrow({ where: { partId: part.id } });
    expect(movement.employeeId).toBe(employee.id);
  });
});
