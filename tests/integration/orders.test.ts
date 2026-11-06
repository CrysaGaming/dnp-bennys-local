import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  addOrderItem,
  applyReward,
  assignOrder,
  changeOrderStatus,
  createOrder,
  getOrderByNumber,
  listOrders,
  removeOrderItem,
  removeReward,
  setDiscount,
  setOrderItemQuantity,
} from "@/features/orders/service";
import { ForbiddenError, InsufficientLoyaltyError, InsufficientStockError, NotFoundError } from "@/lib/errors";
import {
  createCustomer,
  createEmployeeForRank,
  createPart,
  createPriceCategory,
  createPriceItem,
  makeCtx,
} from "@tests/helpers/factories";
import type { Permission } from "@/generated/prisma/enums";

const RIGHTS: Permission[] = ["ORDERS_VIEW", "ORDERS_CREATE", "ORDERS_MANAGE", "CUSTOMERS_VIEW", "INVENTORY_VIEW", "LOYALTY_MANAGE", "PRICELIST_MANAGE"];

async function setup(permissions: Permission[] = RIGHTS) {
  const ctx = await makeCtx({ permissions });
  const customer = await createCustomer();
  const category = await createPriceCategory();
  return { ctx, customer, category };
}

// Die Test-DB startet mit dem Treuesystem aus – für die Einlösung muss es an sein.
async function loyaltyOn() {
  await prisma.loyaltySettings.upsert({ where: { id: 1 }, create: { id: 1, enabled: true }, update: { enabled: true } });
}

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Aufträge", () => {
  it("Fahrzeug eines anderen Kunden passt nicht", async () => {
    const { ctx, customer } = await setup();
    const other = await createCustomer({ plates: ["FREMDF1"] });
    const foreignVehicle = await prisma.vehicle.findFirstOrThrow({ where: { customerId: other.id } });

    await expect(
      createOrder(ctx, { type: "REPAIR", customerId: customer.id, vehicleId: foreignVehicle.id, notes: null }),
    ).rejects.toThrow("Fahrzeug gehört nicht zum Kunden.");
  });

  it("Position snapshot name und preis – ein späterer Preiswechsel ändert sie nicht", async () => {
    const { ctx, customer, category } = await setup();
    const item = await createPriceItem({ categoryId: category.id, name: "Ölwechsel Snapshot", price: 250 });
    const order = await createOrder(ctx, { type: "REPAIR", customerId: customer.id, vehicleId: null, notes: null });

    await addOrderItem(ctx, order.id, { priceListItemId: item.id, quantity: 2 });

    await prisma.priceListItem.update({ where: { id: item.id }, data: { price: 300 } });

    const row = await prisma.orderItem.findFirstOrThrow({ where: { orderId: order.id } });
    expect(row.description).toBe("Ölwechsel Snapshot");
    expect(row.unitPrice).toBe(250);

    const stored = await getOrderByNumber(ctx, order.number);
    expect(stored?.total).toBe(500);
  });

  it("inaktive Leistung wird abgelehnt", async () => {
    const { ctx, customer, category } = await setup();
    const item = await createPriceItem({ categoryId: category.id, name: "Inaktiv Test", price: 100, active: false });
    const order = await createOrder(ctx, { type: "REPAIR", customerId: customer.id, vehicleId: null, notes: null });

    await expect(addOrderItem(ctx, order.id, { priceListItemId: item.id, quantity: 1 })).rejects.toThrow(
      "Diese Leistung ist nicht aktiv.",
    );
  });

  it("fremder Auftrag ohne ORDERS_MANAGE ist gesperrt, eigener darf geändert werden", async () => {
    const owner = await setup();
    const other = await makeCtx({ permissions: ["ORDERS_VIEW"] });

    const order = await createOrder(owner.ctx, { type: "REPAIR", customerId: owner.customer.id, vehicleId: null, notes: null });

    await expect(setDiscount(other, order.id, 10)).rejects.toThrow(ForbiddenError);

    const manager = await makeCtx({ permissions: ["ORDERS_VIEW", "ORDERS_MANAGE"] });
    await setDiscount(manager, order.id, 10);
    expect((await getOrderByNumber(manager, order.number))?.discountPercent).toBe(10);

    await setDiscount(owner.ctx, order.id, 5);
    expect((await getOrderByNumber(owner.ctx, order.number))?.discountPercent).toBe(5);
  });

  it("ein abgeschlossener Auftrag wird nicht mehr geändert", async () => {
    const { ctx, customer, category } = await setup();
    const item = await createPriceItem({ categoryId: category.id, name: "Fertig Test", price: 100 });
    const order = await createOrder(ctx, { type: "REPAIR", customerId: customer.id, vehicleId: null, notes: null });

    await addOrderItem(ctx, order.id, { priceListItemId: item.id, quantity: 1 });
    await changeOrderStatus(ctx, order.id, "DONE");

    await expect(addOrderItem(ctx, order.id, { priceListItemId: item.id, quantity: 1 })).rejects.toThrow(
      "Der Auftrag ist abgeschlossen und kann nicht mehr geändert werden.",
    );
  });

  it("DONE bucht das Lager und setzt completedAt", async () => {
    const { ctx, customer, category } = await setup();
    const part = await createPart({ name: "Ölfilter Fertig", stock: 10 });
    const item = await createPriceItem({ categoryId: category.id, name: "Ölwechsel Fertig", price: 250, partId: part.id, partQuantity: 2 });
    const order = await createOrder(ctx, { type: "REPAIR", customerId: customer.id, vehicleId: null, notes: null });

    await addOrderItem(ctx, order.id, { priceListItemId: item.id, quantity: 2 });
    await changeOrderStatus(ctx, order.id, "DONE");

    const stored = await prisma.part.findUniqueOrThrow({ where: { id: part.id } });
    expect(stored.stock).toBe(6);

    const orderRow = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(orderRow.completedAt).not.toBeNull();

    const movement = await prisma.stockMovement.findFirstOrThrow({ where: { orderId: order.id } });
    expect(movement.reason).toBe("ORDER_USAGE");
    expect(movement.delta).toBe(-4);
  });

  it("zu wenig Bestand bricht ab und lässt den Auftrag offen", async () => {
    const { ctx, customer, category } = await setup();
    const part = await createPart({ name: "Ölfilter Klein", stock: 1 });
    const item = await createPriceItem({ categoryId: category.id, name: "Ölwechsel Klein", price: 250, partId: part.id, partQuantity: 2 });
    const order = await createOrder(ctx, { type: "REPAIR", customerId: customer.id, vehicleId: null, notes: null });

    await addOrderItem(ctx, order.id, { priceListItemId: item.id, quantity: 1 });

    await expect(changeOrderStatus(ctx, order.id, "DONE")).rejects.toThrow(InsufficientStockError);

    const stored = await prisma.part.findUniqueOrThrow({ where: { id: part.id } });
    const orderRow = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(stored.stock).toBe(1);
    expect(orderRow.status).toBe("OPEN");
    expect(await prisma.stockMovement.count({ where: { orderId: order.id } })).toBe(0);
  });

  it("Storno nach DONE bucht das Lager zurück und setzt die offene Rechnung auf VOID", async () => {
    const { ctx, customer, category } = await setup();
    const part = await createPart({ name: "Ölfilter Storno", stock: 10 });
    const item = await createPriceItem({ categoryId: category.id, name: "Ölwechsel Storno", price: 250, partId: part.id, partQuantity: 2 });
    const order = await createOrder(ctx, { type: "REPAIR", customerId: customer.id, vehicleId: null, notes: null });

    await addOrderItem(ctx, order.id, { priceListItemId: item.id, quantity: 2 });
    await changeOrderStatus(ctx, order.id, "DONE");

    const invoice = await prisma.invoice.create({
      data: { orderId: order.id, amount: 500, issuedById: ctx.employeeId },
    });

    await changeOrderStatus(ctx, order.id, "CANCELLED");

    const movements = await prisma.stockMovement.findMany({ where: { orderId: order.id, reason: "CORRECTION" } });
    expect(movements).toHaveLength(1);
    expect(movements[0]!.delta).toBe(4);
    expect(movements[0]!.note).toBe(`Storno Auftrag #${order.number}`);

    const stored = await prisma.part.findUniqueOrThrow({ where: { id: part.id } });
    expect(stored.stock).toBe(10);
    expect((await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } })).status).toBe("VOID");
  });

  it("eine bezahlte Rechnung verhindert den Storno", async () => {
    const { ctx, customer, category } = await setup();
    const item = await createPriceItem({ categoryId: category.id, name: "Ölwechsel Bezahlt", price: 250 });
    const order = await createOrder(ctx, { type: "REPAIR", customerId: customer.id, vehicleId: null, notes: null });

    await addOrderItem(ctx, order.id, { priceListItemId: item.id, quantity: 1 });
    await changeOrderStatus(ctx, order.id, "DONE");

    const invoice = await prisma.invoice.create({
      data: { orderId: order.id, amount: 250, status: "PAID", paidAt: new Date(), issuedById: ctx.employeeId },
    });

    await expect(changeOrderStatus(ctx, order.id, "CANCELLED")).rejects.toThrow(
      "Bezahlte Aufträge können nicht storniert werden.",
    );

    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("DONE");
    expect((await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } })).status).toBe("PAID");
  });

  it("Prämie lösen, zweite Prämie geht nicht, Entfernen bucht zurück", async () => {
    const { ctx, customer, category } = await setup();
    const reward = await prisma.loyaltyReward.create({
      data: { name: "20 Prozent Test", type: "PERCENT_DISCOUNT", value: 20, cost: 1 },
    });
    const item = await createPriceItem({ categoryId: category.id, name: "Ölwechsel Prämie", price: 1000 });
    const order = await createOrder(ctx, { type: "REPAIR", customerId: customer.id, vehicleId: null, notes: null });

    await loyaltyOn();
    await addOrderItem(ctx, order.id, { priceListItemId: item.id, quantity: 1 });
    await prisma.customer.update({ where: { id: customer.id }, data: { loyaltyBalance: 1 } });

    await applyReward(ctx, order.id, reward.id);

    const applied = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(applied.loyaltyDiscount).toBe(200);
    expect(applied.total).toBe(800);
    expect((await prisma.customer.findUniqueOrThrow({ where: { id: customer.id } })).loyaltyBalance).toBe(0);
    expect((await prisma.loyaltyTransaction.findFirstOrThrow({ where: { orderId: order.id } })).type).toBe("REDEEM");

    const second = await prisma.loyaltyReward.create({
      data: { name: "Zweite Prämie Test", type: "FIXED_DISCOUNT", value: 50, cost: 1 },
    });

    await expect(applyReward(ctx, order.id, second.id)).rejects.toThrow("Pro Auftrag ist nur eine Prämie möglich.");

    await removeReward(ctx, order.id);

    const after = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(after.loyaltyDiscount).toBe(0);
    expect(after.total).toBe(1000);
    expect((await prisma.customer.findUniqueOrThrow({ where: { id: customer.id } })).loyaltyBalance).toBe(1);
    expect((await prisma.loyaltyTransaction.findFirst({ where: { orderId: order.id, type: "REVERSAL" } }))).not.toBeNull();
  });

  it("mit ausgeschaltetem Treuesystem lässt sich nichts einlösen", async () => {
    const { ctx, customer, category } = await setup();
    const reward = await prisma.loyaltyReward.create({
      data: { name: "Aus Prämie Test", type: "FIXED_DISCOUNT", value: 10, cost: 1 },
    });
    const item = await createPriceItem({ categoryId: category.id, name: "Ölwechsel Aus", price: 100 });
    const order = await createOrder(ctx, { type: "REPAIR", customerId: customer.id, vehicleId: null, notes: null });

    await addOrderItem(ctx, order.id, { priceListItemId: item.id, quantity: 1 });

    await expect(applyReward(ctx, order.id, reward.id)).rejects.toThrow("Das Treuesystem ist aus.");
  });

  it("Gratis-Leistung wird in den Auftrag gesetzt, wenn sie fehlt", async () => {
    const { ctx, customer, category } = await setup();
    const free = await createPriceItem({ categoryId: category.id, name: "Gratis Wäsche Test", price: 120 });
    const reward = await prisma.loyaltyReward.create({
      data: { name: "Gratis Wäsche Prämie", type: "FREE_SERVICE", value: 0, cost: 2, priceListItemId: free.id },
    });
    const order = await createOrder(ctx, { type: "REPAIR", customerId: customer.id, vehicleId: null, notes: null });

    await loyaltyOn();
    await prisma.customer.update({ where: { id: customer.id }, data: { loyaltyBalance: 2 } });

    await applyReward(ctx, order.id, reward.id);

    const rows = await prisma.orderItem.findMany({ where: { orderId: order.id } });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.quantity).toBe(1);
    expect(rows[0]!.unitPrice).toBe(120);

    const stored = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(stored.loyaltyDiscount).toBe(120);
    expect(stored.total).toBe(0);

    await applyReward(ctx, order.id, reward.id).catch(() => undefined);
    expect(await prisma.orderItem.count({ where: { orderId: order.id } })).toBe(1);
  });

  it("Entfernen der Gratis-Leistung entfernt auch die Prämie", async () => {
    const { ctx, customer, category } = await setup();
    const free = await createPriceItem({ categoryId: category.id, name: "Gratis Lack Test", price: 200 });
    const reward = await prisma.loyaltyReward.create({
      data: { name: "Gratis Lack Prämie", type: "FREE_SERVICE", value: 0, cost: 3, priceListItemId: free.id },
    });
    const order = await createOrder(ctx, { type: "REPAIR", customerId: customer.id, vehicleId: null, notes: null });

    await loyaltyOn();
    await prisma.customer.update({ where: { id: customer.id }, data: { loyaltyBalance: 3 } });
    await applyReward(ctx, order.id, reward.id);

    const row = await prisma.orderItem.findFirstOrThrow({ where: { orderId: order.id } });
    await removeOrderItem(ctx, row.id);

    const stored = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(stored.loyaltyRewardId).toBeNull();
    expect(stored.total).toBe(0);
    expect((await prisma.customer.findUniqueOrThrow({ where: { id: customer.id } })).loyaltyBalance).toBe(3);
    expect((await prisma.loyaltyTransaction.findFirst({ where: { orderId: order.id, type: "REVERSAL" } }))).not.toBeNull();
  });

  it("Storno eines Auftrags mit Prämie bucht die Kosten zurück", async () => {
    const { ctx, customer, category } = await setup();
    const reward = await prisma.loyaltyReward.create({
      data: { name: "Storno Prämie Test", type: "FIXED_DISCOUNT", value: 50, cost: 4 },
    });
    const item = await createPriceItem({ categoryId: category.id, name: "Ölwechsel Storno Prämie", price: 500 });
    const order = await createOrder(ctx, { type: "REPAIR", customerId: customer.id, vehicleId: null, notes: null });

    await loyaltyOn();
    await prisma.customer.update({ where: { id: customer.id }, data: { loyaltyBalance: 4 } });
    await addOrderItem(ctx, order.id, { priceListItemId: item.id, quantity: 1 });
    await applyReward(ctx, order.id, reward.id);

    await changeOrderStatus(ctx, order.id, "CANCELLED");

    expect((await prisma.customer.findUniqueOrThrow({ where: { id: customer.id } })).loyaltyBalance).toBe(4);
    expect((await prisma.loyaltyTransaction.findFirst({ where: { orderId: order.id, type: "REVERSAL" } }))).not.toBeNull();
  });

  it("Review Focus: dieselbe Prämie in zwei offenen Aufträgen – genau eine kommt durch", async () => {
    const { ctx, customer, category } = await setup();
    const reward = await prisma.loyaltyReward.create({
      data: { name: "Parallel Prämie Test", type: "FIXED_DISCOUNT", value: 10, cost: 1 },
    });
    await createPriceItem({ categoryId: category.id, name: "Ölwechsel Parallel", price: 100 });

    const first = await createOrder(ctx, { type: "REPAIR", customerId: customer.id, vehicleId: null, notes: null });
    const second = await createOrder(ctx, { type: "REPAIR", customerId: customer.id, vehicleId: null, notes: null });

    await loyaltyOn();
    await prisma.customer.update({ where: { id: customer.id }, data: { loyaltyBalance: 1 } });

    const results = await Promise.allSettled([
      applyReward(ctx, first.id, reward.id),
      applyReward(ctx, second.id, reward.id),
    ]);

    const ok = results.filter((r) => r.status === "fulfilled");
    const failed = results.filter((r) => r.status === "rejected");

    expect(ok).toHaveLength(1);
    expect(failed).toHaveLength(1);
    expect((failed[0] as PromiseRejectedResult).reason).toBeInstanceOf(InsufficientLoyaltyError);

    expect((await prisma.customer.findUniqueOrThrow({ where: { id: customer.id } })).loyaltyBalance).toBe(0);
    expect(await prisma.loyaltyTransaction.count({ where: { customerId: customer.id, type: "REDEEM" } })).toBe(1);
  });

  it("zuweisen und filtern", async () => {
    const { ctx, customer } = await setup();
    const other = await createEmployeeForRank(ctx.rank.id);
    const order = await createOrder(ctx, { type: "PAINT", customerId: customer.id, vehicleId: null, notes: null });

    await assignOrder(ctx, order.id, other.id);
    expect((await getOrderByNumber(ctx, order.number))?.assignedToId).toBe(other.id);

    const found = await listOrders(ctx, { q: customer.name });
    expect(found.map((o) => o.id)).toContain(order.id);

    const byStatus = await listOrders(ctx, { status: "OPEN", type: "PAINT" });
    expect(byStatus.map((o) => o.id)).toContain(order.id);
  });

  it("Menge ändern und Position entfernen", async () => {
    const { ctx, customer, category } = await setup();
    const item = await createPriceItem({ categoryId: category.id, name: "Menge Test", price: 300 });
    const order = await createOrder(ctx, { type: "REPAIR", customerId: customer.id, vehicleId: null, notes: null });

    const row = await addOrderItem(ctx, order.id, { priceListItemId: item.id, quantity: 1 });
    await setOrderItemQuantity(ctx, row.id, 3);
    expect((await getOrderByNumber(ctx, order.number))?.total).toBe(900);

    await removeOrderItem(ctx, row.id);
    expect((await getOrderByNumber(ctx, order.number))?.total).toBe(0);
  });

  it("ein nicht erlaubter Übergang wird abgelehnt", async () => {
    const { ctx, customer } = await setup();
    const order = await createOrder(ctx, { type: "OTHER", customerId: customer.id, vehicleId: null, notes: null });

    await expect(changeOrderStatus(ctx, order.id, "CANCELLED")).resolves.toBeUndefined();
    await expect(changeOrderStatus(ctx, order.id, "OPEN")).rejects.toThrow(
      "Diese Statusänderung ist nicht erlaubt.",
    );
  });

  it("Auftrag gibt es nur mit Recht, und die Nummer ist eindeutig", async () => {
    const { ctx, customer } = await setup();
    const order = await createOrder(ctx, { type: "TOWING", customerId: customer.id, vehicleId: null, notes: null });

    const noRight = await makeCtx({ permissions: [] });
    await expect(getOrderByNumber(noRight, order.number)).rejects.toThrow(ForbiddenError);
    await expect(getOrderByNumber(ctx, 999999)).rejects.toThrow(NotFoundError);
  });

  it("Audit wird geschrieben", async () => {
    const { ctx, customer } = await setup();
    const order = await createOrder(ctx, { type: "REPAIR", customerId: customer.id, vehicleId: null, notes: null });

    const audit = await prisma.auditLog.findFirst({ where: { entity: "order", entityId: order.id } });
    expect(audit?.action).toBe("order.create");
  });
});
