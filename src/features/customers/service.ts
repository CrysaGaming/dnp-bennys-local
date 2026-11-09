import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { assertPermission } from "@/lib/permissions";
import { BusinessRuleError, ConflictError, NotFoundError } from "@/lib/errors";
import type { SessionContext } from "@/lib/session-types";
import { customerSchema, vehicleSchema, type VehicleValues } from "./schemas";
import { formatCustomerNumber, normalizePlate, phoneDigits } from "./normalize";

const PLATE_CONFLICT = "Kennzeichen ist schon vergeben";
const DEFAULT_SEARCH_LIMIT = 200;

export type CustomerRow = {
  id: string;
  number: number;
  name: string;
  phone: string | null;
  plates: string[];
  loyaltyBalance: number;
  lastVisitAt: Date | null;
};

export type CustomerDetail = CustomerRow & {
  notes: string | null;
  vehicles: Array<{ id: string; model: string; plate: string; color: string | null }>;
  orders: Array<{ id: string; number: number; status: string; total: number; createdAt: Date }>;
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    balanceAfter: number;
    note: string | null;
    createdAt: Date;
  }>;
};

function toRow(
  customer: {
    id: string;
    number: number;
    name: string;
    phone: string | null;
    loyaltyBalance: number;
    lastVisitAt: Date | null;
  },
  plates: string[],
): CustomerRow {
  return {
    id: customer.id,
    number: customer.number,
    name: customer.name,
    phone: customer.phone,
    plates,
    loyaltyBalance: customer.loyaltyBalance,
    lastVisitAt: customer.lastVisitAt,
  };
}

function plateConflict(index: number): ConflictError {
  return new ConflictError(`vehicles.${index}.plate`, PLATE_CONFLICT);
}

/**
 * Das Kennzeichen ist unique. Zwei derselben in einer Eingabe sind ein Eingabefehler (das
 * Feld wird genannt), ein Kennzeichen von einem anderen Kunden ein Konflikt – das eigene
 * Fahrzeug desselben Kunden ist erlaubt.
 */
async function assertPlatesFree(
  tx: Prisma.TransactionClient,
  vehicles: VehicleValues[],
  selfCustomerId?: string,
): Promise<void> {
  const seen = new Set<string>();

  for (const [index, vehicle] of vehicles.entries()) {
    if (seen.has(vehicle.plate)) throw plateConflict(index);
    seen.add(vehicle.plate);

    const existing = await tx.vehicle.findFirst({ where: { plate: vehicle.plate } });
    if (existing && existing.customerId !== selfCustomerId) {
      throw plateConflict(index);
    }
  }
}

export async function searchCustomers(
  ctx: SessionContext,
  q: string,
  limit = DEFAULT_SEARCH_LIMIT,
): Promise<CustomerRow[]> {
  assertPermission(ctx, "CUSTOMERS_VIEW");

  const term = q.trim();

  if (term === "") {
    const rows = await prisma.customer.findMany({
      include: { vehicles: { orderBy: { plate: "asc" } } },
      orderBy: { name: "asc" },
      take: limit,
    });

    return rows.map((c) => toRow(c, c.vehicles.map((v) => v.plate)));
  }

  const plate = normalizePlate(term);

  const nameOrPlate = await prisma.customer.findMany({
    where: {
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { vehicles: { some: { plate: { contains: plate, mode: "insensitive" } } } },
      ],
    },
    include: { vehicles: { orderBy: { plate: "asc" } } },
    take: limit,
  });

  const ids = new Set(nameOrPlate.map((c) => c.id));

  // Nach Telefonzahl wird erst ab drei Ziffern gesucht – "55" würde zu viele liefern.
  const digits = phoneDigits(term);
  if (digits.length >= 3) {
    const phoneHits = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "customer"
      WHERE phone IS NOT NULL
        AND regexp_replace(phone, '\\D', '', 'g') LIKE '%' || ${digits} || '%'
      LIMIT ${limit}`;

    for (const hit of phoneHits) ids.add(hit.id);
  }

  if (ids.size === 0) return [];

  const found = await prisma.customer.findMany({
    where: { id: { in: [...ids] } },
    include: { vehicles: { orderBy: { plate: "asc" } } },
    orderBy: { name: "asc" },
  });

  return found.map((c) => toRow(c, c.vehicles.map((v) => v.plate)));
}

export async function getCustomerByNumber(ctx: SessionContext, number: number): Promise<CustomerDetail> {
  assertPermission(ctx, "CUSTOMERS_VIEW");

  const customer = await prisma.customer.findUnique({
    where: { number },
    include: {
      vehicles: { orderBy: { plate: "asc" } },
      orders: { orderBy: { createdAt: "desc" }, take: 20 },
      loyaltyTransactions: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });

  if (!customer) throw new NotFoundError("Kunde nicht gefunden.");

  return {
    ...toRow(customer, customer.vehicles.map((v) => v.plate)),
    notes: customer.notes,
    vehicles: customer.vehicles.map((v) => ({
      id: v.id,
      model: v.model,
      plate: v.plate,
      color: v.color,
    })),
    orders: customer.orders.map((o) => ({
      id: o.id,
      number: o.number,
      status: o.status,
      total: o.total,
      createdAt: o.createdAt,
    })),
    transactions: customer.loyaltyTransactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      balanceAfter: t.balanceAfter,
      note: t.note,
      createdAt: t.createdAt,
    })),
  };
}

export async function createCustomer(
  ctx: SessionContext,
  input: unknown,
): Promise<{ customer: CustomerRow; warnings: string[] }> {
  assertPermission(ctx, "CUSTOMERS_EDIT");

  const data = customerSchema.parse(input);

  const result = await prisma.$transaction(async (tx) => {
    await assertPlatesFree(tx, data.vehicles);

    const created = await tx.customer.create({
      data: { name: data.name, phone: data.phone, notes: data.notes },
    });

    for (const vehicle of data.vehicles) {
      await tx.vehicle.create({
        data: { customerId: created.id, model: vehicle.model, plate: vehicle.plate, color: vehicle.color },
      });
    }

    // Doppelte Rufnummer ist kein Fehler, nur ein Hinweis – dieselbe Nummer kann in einer
    // Werkstatt mehrere Kunden haben (Spec 5.6).
    const warnings: string[] = [];
    if (data.phone) {
      const other = await tx.customer.findFirst({ where: { phone: data.phone, id: { not: created.id } } });
      if (other) warnings.push(`Rufnummer ist schon bei Kunde ${formatCustomerNumber(other.number)} hinterlegt.`);
    }

    await writeAudit(tx, {
      actorId: ctx.userId,
      action: "customer.create",
      entity: "customer",
      entityId: created.id,
      data: { name: created.name, phone: created.phone, vehicles: data.vehicles.length },
    });

    return {
      customer: toRow(created, data.vehicles.map((v) => v.plate)),
      warnings,
    };
  });

  return result;
}

export async function updateCustomer(ctx: SessionContext, id: string, input: unknown): Promise<CustomerRow> {
  assertPermission(ctx, "CUSTOMERS_EDIT");

  const data = customerSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.customer.findUnique({ where: { id }, include: { vehicles: true } });
    if (!existing) throw new NotFoundError("Kunde nicht gefunden.");

    await assertPlatesFree(tx, data.vehicles, id);

    const updated = await tx.customer.update({
      where: { id },
      data: { name: data.name, phone: data.phone, notes: data.notes },
    });

    for (const vehicle of existing.vehicles) {
      if (data.vehicles.some((v) => v.plate === vehicle.plate)) continue;

      const orders = await tx.order.count({ where: { vehicleId: vehicle.id } });
      if (orders > 0) {
        await tx.vehicle.update({ where: { id: vehicle.id }, data: { customerId: null } });
      } else {
        await tx.vehicle.delete({ where: { id: vehicle.id } });
      }
    }

    for (const vehicle of data.vehicles) {
      const row = await tx.vehicle.findFirst({ where: { plate: vehicle.plate } });
      if (!row) {
        await tx.vehicle.create({
          data: { customerId: id, model: vehicle.model, plate: vehicle.plate, color: vehicle.color },
        });
      }
    }

    await writeAudit(tx, {
      actorId: ctx.userId,
      action: "customer.update",
      entity: "customer",
      entityId: id,
      data: {
        before: { name: existing.name, phone: existing.phone },
        after: { name: updated.name, phone: updated.phone },
      },
    });

    return toRow(
      updated,
      (await tx.vehicle.findMany({ where: { customerId: id }, orderBy: { plate: "asc" } })).map((v) => v.plate),
    );
  });
}

export async function addVehicle(ctx: SessionContext, customerId: string, input: unknown) {
  assertPermission(ctx, "CUSTOMERS_EDIT");

  const vehicle = vehicleSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new NotFoundError("Kunde nicht gefunden.");

    await assertPlatesFree(tx, [vehicle], customerId);

    const created = await tx.vehicle.create({
      data: { customerId, model: vehicle.model, plate: vehicle.plate, color: vehicle.color },
    });

    await writeAudit(tx, {
      actorId: ctx.userId,
      action: "vehicle.add",
      entity: "vehicle",
      entityId: created.id,
      data: { plate: created.plate, model: created.model },
    });

    return created;
  });
}

/** Ein Fahrzeug mit Auftrag bleibt stehen – es wird nur vom Kunden gelöst (Spec 5.6). */
export async function removeVehicle(ctx: SessionContext, vehicleId: string): Promise<void> {
  assertPermission(ctx, "CUSTOMERS_EDIT");

  await prisma.$transaction(async (tx) => {
    const vehicle = await tx.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw new NotFoundError("Fahrzeug nicht gefunden.");

    const orders = await tx.order.count({ where: { vehicleId } });

    if (orders > 0) {
      await tx.vehicle.update({ where: { id: vehicleId }, data: { customerId: null } });
    } else {
      await tx.vehicle.delete({ where: { id: vehicleId } });
    }

    await writeAudit(tx, {
      actorId: ctx.userId,
      action: "vehicle.remove",
      entity: "vehicle",
      entityId: vehicleId,
      data: { plate: vehicle.plate, detached: orders > 0 },
    });
  });
}

/** Kunde ist die Ausnahme vom Verbot des harten Löschens – nur ohne Aufträge und Buchungen. */
export async function deleteCustomer(ctx: SessionContext, id: string): Promise<void> {
  assertPermission(ctx, "CUSTOMERS_EDIT");

  await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findUnique({
      where: { id },
      include: { _count: { select: { orders: true, loyaltyTransactions: true } } },
    });

    if (!customer) throw new NotFoundError("Kunde nicht gefunden.");

    if (customer._count.orders > 0 || customer._count.loyaltyTransactions > 0) {
      throw new BusinessRuleError(
        "Kunde hat Aufträge oder Treue-Buchungen und kann nicht gelöscht werden.",
      );
    }

    await tx.customer.delete({ where: { id } });

    await writeAudit(tx, {
      actorId: ctx.userId,
      action: "customer.delete",
      entity: "customer",
      entityId: id,
      data: { before: { name: customer.name, number: customer.number } },
    });
  });
}
