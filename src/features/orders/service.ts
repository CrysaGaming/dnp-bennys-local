import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { assertPermission } from "@/lib/permissions";
import { BusinessRuleError, ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import type { SessionContext } from "@/lib/session-types";
import type { OrderStatus, OrderType } from "@/generated/prisma/enums";
import { bookStock } from "@/features/inventory/stock";
import { bookLoyalty } from "@/features/loyalty/ledger";
import { calcOrderTotals } from "./pricing";
import { canEditOrder, canTransition } from "./status";
import { discountPercentSchema, orderInputSchema, orderItemSchema } from "./schemas";

type OrderRow = Prisma.OrderModel;
type Tx = Prisma.TransactionClient;

const CLOSED_DONE = "Der Auftrag ist abgeschlossen und kann nicht mehr geändert werden.";
const CLOSED_CANCELLED = "Der Auftrag ist storniert und kann nicht mehr geändert werden.";
const BAD_TRANSITION = "Diese Statusänderung ist nicht erlaubt.";
const PAID = "Bezahlte Aufträge können nicht storniert werden.";
const ONE_REWARD = "Pro Auftrag ist nur eine Prämie möglich.";
const LOYALTY_OFF = "Das Treuesystem ist aus.";

/** Nach jeder Änderung neu rechnen – der Preis ist Snapshot, die Summe darf nicht alt bleiben. */
async function recalcOrder(tx: Tx, orderId: string) {
  const order = await tx.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: true, loyaltyReward: true },
  });

  const totals = calcOrderTotals({
    items: order.items.map((item) => ({
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      priceListItemId: item.priceListItemId,
    })),
    discountPercent: order.discountPercent,
    reward: order.loyaltyReward
      ? {
          type: order.loyaltyReward.type,
          value: order.loyaltyReward.value,
          priceListItemId: order.loyaltyReward.priceListItemId,
        }
      : null,
  });

  await tx.order.update({
    where: { id: orderId },
    data: {
      subtotal: totals.subtotal,
      loyaltyDiscount: totals.loyaltyDiscount,
      total: totals.total,
    },
  });

  return totals;
}

async function assertMutable(tx: Tx, ctx: SessionContext, orderId: string): Promise<OrderRow> {
  const order = await tx.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError("Auftrag nicht gefunden.");
  if (!canEditOrder(ctx, order)) throw new ForbiddenError();

  if (order.status === "DONE") throw new BusinessRuleError(CLOSED_DONE);
  if (order.status === "CANCELLED") throw new BusinessRuleError(CLOSED_CANCELLED);

  return order;
}

async function mutate<T>(
  ctx: SessionContext,
  orderId: string,
  action: string,
  run: (tx: Tx, order: OrderRow) => Promise<T>,
): Promise<T> {
  assertPermission(ctx, "ORDERS_VIEW");

  return prisma.$transaction(async (tx) => {
    const order = await assertMutable(tx, ctx, orderId);
    const result = await run(tx, order);
    await recalcOrder(tx, orderId);

    await writeAudit(tx, {
      actorId: ctx.userId,
      action: `order.${action}`,
      entity: "order",
      entityId: orderId,
      data: { number: order.number },
    });

    return result;
  });
}

export async function createOrder(
  ctx: SessionContext,
  input: unknown,
): Promise<{ id: string; number: number }> {
  assertPermission(ctx, "ORDERS_CREATE");
  const data = orderInputSchema.parse(input);

  const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
  if (!customer) throw new NotFoundError("Kunde nicht gefunden.");

  if (data.vehicleId) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
    if (!vehicle) throw new NotFoundError("Fahrzeug nicht gefunden.");
    if (vehicle.customerId !== customer.id) {
      throw new BusinessRuleError("Fahrzeug gehört nicht zum Kunden.");
    }
  }

  const order = await prisma.order.create({
    data: {
      type: data.type,
      customerId: customer.id,
      vehicleId: data.vehicleId,
      notes: data.notes,
      createdById: ctx.employeeId,
    },
  });

  await writeAudit(prisma, {
    actorId: ctx.userId,
    action: "order.create",
    entity: "order",
    entityId: order.id,
    data: { number: order.number, customerId: customer.id },
  });

  return { id: order.id, number: order.number };
}

export async function getOrderByNumber(ctx: SessionContext, number: number) {
  assertPermission(ctx, "ORDERS_VIEW");

  const order = await prisma.order.findUnique({
    where: { number },
    include: {
      customer: true,
      vehicle: true,
      createdBy: { select: { id: true, user: { select: { name: true } } } },
      assignedTo: { select: { id: true, user: { select: { name: true } } } },
      loyaltyReward: true,
      items: true,
      invoice: true,
    },
  });

  if (!order) throw new NotFoundError("Auftrag nicht gefunden.");
  return order;
}

export async function listOrders(
  ctx: SessionContext,
  filter: { status?: OrderStatus; type?: OrderType; employeeId?: string; q?: string } = {},
) {
  assertPermission(ctx, "ORDERS_VIEW");

  const q = filter.q?.trim();

  return prisma.order.findMany({
    where: {
      status: filter.status,
      type: filter.type,
      assignedToId: filter.employeeId,
      ...(q
        ? {
          OR: [
            { customer: { name: { contains: q, mode: "insensitive" } } },
            { vehicle: { plate: { contains: q, mode: "insensitive" } } },
            ...(Number.isInteger(Number(q)) ? [{ customer: { number: { equals: Number(q) } } }] : []),
          ],
        }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { customer: true, vehicle: true },
  });
}

export async function addOrderItem(ctx: SessionContext, orderId: string, input: unknown) {
  const data = orderItemSchema.parse(input);

  return mutate(ctx, orderId, "add_item", async (tx, order) => {
    const item = await tx.priceListItem.findUnique({ where: { id: data.priceListItemId } });
    if (!item) throw new NotFoundError("Leistung nicht gefunden.");
    if (!item.active) throw new BusinessRuleError("Diese Leistung ist nicht aktiv.");

    return tx.orderItem.create({
      data: {
        orderId: order.id,
        priceListItemId: item.id,
        description: item.name,
        unitPrice: item.price,
        quantity: data.quantity,
      },
    });
  });
}

async function mutateItem<T>(
  ctx: SessionContext,
  itemId: string,
  action: string,
  run: (tx: Tx, item: Prisma.OrderItemModel, order: OrderRow) => Promise<T>,
): Promise<T> {
  assertPermission(ctx, "ORDERS_VIEW");

  return prisma.$transaction(async (tx) => {
    const item = await tx.orderItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundError("Position nicht gefunden.");

    const order = await assertMutable(tx, ctx, item.orderId);
    const result = await run(tx, item, order);
    await recalcOrder(tx, order.id);

    await writeAudit(tx, {
      actorId: ctx.userId,
      action: `order.${action}`,
      entity: "order",
      entityId: order.id,
      data: { number: order.number, itemId: item.id },
    });

    return result;
  });
}

export async function setOrderItemQuantity(ctx: SessionContext, itemId: string, quantity: number) {
  const q = orderItemSchema.shape.quantity.parse(quantity);

  return mutateItem(ctx, itemId, "set_quantity", async (tx, item) => {
    return tx.orderItem.update({ where: { id: item.id }, data: { quantity: q } });
  });
}

/**
 * Eine Position, die zu einer Gratis-Leistung gehört, hängt an der Prämie. Fällt sie weg, fällt
 * die Prämie zurück – sonst hätte der Kunde eingelöst, aber nichts bekommen.
 */
export async function removeOrderItem(ctx: SessionContext, itemId: string) {
  return mutateItem(ctx, itemId, "remove_item", async (tx, item, order) => {
    const reward = order.loyaltyRewardId
      ? await tx.loyaltyReward.findUnique({ where: { id: order.loyaltyRewardId } })
      : null;

    await tx.orderItem.delete({ where: { id: item.id } });

    if (reward && reward.type === "FREE_SERVICE" && reward.priceListItemId === item.priceListItemId) {
      await bookLoyalty(tx, {
        customerId: order.customerId,
        type: "REVERSAL",
        amount: reward.cost,
        employeeId: ctx.employeeId,
        orderId: order.id,
        rewardId: reward.id,
        note: `Prämie „${reward.name}“ entfernt`,
      });

      await tx.order.update({ where: { id: order.id }, data: { loyaltyRewardId: null } });
    }

    return item.id;
  });
}

export async function setDiscount(ctx: SessionContext, orderId: string, percent: number) {
  const value = discountPercentSchema.parse(percent);

  return mutate(ctx, orderId, "set_discount", async (tx, order) => {
    await tx.order.update({ where: { id: order.id }, data: { discountPercent: value } });
    return value;
  });
}

export async function assignOrder(ctx: SessionContext, orderId: string, employeeId: string | null) {
  return mutate(ctx, orderId, "assign", async (tx, order) => {
    if (employeeId) {
      const employee = await tx.employee.findUnique({ where: { id: employeeId } });
      if (!employee) throw new NotFoundError("Mitarbeiter nicht gefunden.");
    }

    await tx.order.update({ where: { id: order.id }, data: { assignedToId: employeeId } });
    return employeeId;
  });
}

export async function changeOrderStatus(ctx: SessionContext, orderId: string, to: OrderStatus): Promise<void> {
  assertPermission(ctx, "ORDERS_VIEW");

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundError("Auftrag nicht gefunden.");
    if (!canEditOrder(ctx, order)) throw new ForbiddenError();
    if (!canTransition(order.status, to)) throw new BusinessRuleError(BAD_TRANSITION);

    const invoice = await tx.invoice.findUnique({ where: { orderId: order.id } });

    if (to === "CANCELLED") {
      if (invoice?.status === "PAID") throw new BusinessRuleError(PAID);
    }

    const items = await tx.orderItem.findMany({
      where: { orderId: order.id },
      include: { priceListItem: true },
    });

    if (to === "DONE") {
      for (const item of items) {
        const partId = item.priceListItem?.partId;
        if (!partId) continue;

        await bookStock(tx, {
          partId,
          delta: -(item.priceListItem!.partQuantity * item.quantity),
          reason: "ORDER_USAGE",
          employeeId: ctx.employeeId,
          orderId: order.id,
        });
      }
    }

    if (to === "CANCELLED" && order.status === "DONE") {
      for (const item of items) {
        const partId = item.priceListItem?.partId;
        if (!partId) continue;

        await bookStock(tx, {
          partId,
          delta: item.priceListItem!.partQuantity * item.quantity,
          reason: "CORRECTION",
          employeeId: ctx.employeeId,
          orderId: order.id,
          note: `Storno Auftrag #${order.number}`,
        });
      }

      if (invoice && invoice.status !== "PAID") {
        await tx.invoice.update({ where: { id: invoice.id }, data: { status: "VOID" } });
      }
    }

    if (to === "CANCELLED" && order.loyaltyRewardId) {
      const reward = await tx.loyaltyReward.findUnique({ where: { id: order.loyaltyRewardId } });
      if (reward) {
        await bookLoyalty(tx, {
          customerId: order.customerId,
          type: "REVERSAL",
          amount: reward.cost,
          employeeId: ctx.employeeId,
          orderId: order.id,
          rewardId: reward.id,
          note: `Storno Auftrag #${order.number}`,
        });
      }
    }

    await tx.order.update({
      where: { id: order.id },
      data: { status: to, completedAt: to === "DONE" ? new Date() : order.completedAt },
    });

    await writeAudit(tx, {
      actorId: ctx.userId,
      action: "order.change_status",
      entity: "order",
      entityId: order.id,
      data: { number: order.number, from: order.status, to },
    });
  });
}

/**
 * Einlösen (Spec 3.6). Das Guthaben wird hier abgezogen, nicht beim Bezahlen – sonst kann
 * jemand dieselben Stempel in zwei offenen Aufträgen gleichzeitig ausgeben.
 */
export async function applyReward(ctx: SessionContext, orderId: string, rewardId: string): Promise<void> {
  return mutate(ctx, orderId, "apply_reward", async (tx, order) => {
    const settings = await tx.loyaltySettings.findUnique({ where: { id: 1 } });
    if (!settings?.enabled) throw new BusinessRuleError(LOYALTY_OFF);

    if (order.loyaltyRewardId) throw new ConflictError("loyaltyRewardId", ONE_REWARD);

    const reward = await tx.loyaltyReward.findUnique({ where: { id: rewardId } });
    if (!reward) throw new NotFoundError("Prämie nicht gefunden.");
    if (!reward.active) throw new BusinessRuleError("Diese Prämie ist nicht aktiv.");

    await bookLoyalty(tx, {
      customerId: order.customerId,
      type: "REDEEM",
      amount: -reward.cost,
      employeeId: ctx.employeeId,
      orderId: order.id,
      rewardId: reward.id,
    });

    if (reward.type === "FREE_SERVICE" && reward.priceListItemId) {
      const exists = await tx.orderItem.findFirst({
        where: { orderId: order.id, priceListItemId: reward.priceListItemId },
      });

      if (!exists) {
        const item = await tx.priceListItem.findUnique({ where: { id: reward.priceListItemId } });
        if (!item) throw new NotFoundError("Leistung nicht gefunden.");

        await tx.orderItem.create({
          data: {
            orderId: order.id,
            priceListItemId: item.id,
            description: item.name,
            unitPrice: item.price,
            quantity: 1,
          },
        });
      }
    }

    await tx.order.update({ where: { id: order.id }, data: { loyaltyRewardId: reward.id } });
  });
}

export async function removeReward(ctx: SessionContext, orderId: string): Promise<void> {
  return mutate(ctx, orderId, "remove_reward", async (tx, order) => {
    if (!order.loyaltyRewardId) throw new NotFoundError("Keine Prämie auf diesem Auftrag.");

    const reward = await tx.loyaltyReward.findUnique({ where: { id: order.loyaltyRewardId } });
    if (!reward) throw new NotFoundError("Prämie nicht gefunden.");

    await bookLoyalty(tx, {
      customerId: order.customerId,
      type: "REVERSAL",
      amount: reward.cost,
      employeeId: ctx.employeeId,
      orderId: order.id,
      rewardId: reward.id,
      note: "Prämie aus dem Auftrag entfernt",
    });

    await tx.order.update({ where: { id: order.id }, data: { loyaltyRewardId: null } });
  });
}
