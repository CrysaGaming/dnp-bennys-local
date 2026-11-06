import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  getDashboardStats,
  getOnDutyList,
  getRecentOrders,
  getRevenueLast7Days,
} from "@/features/dashboard/queries";
import { createCustomer, createPart, createEmployeeForRank, makeCtx } from "@tests/helpers/factories";

const NOW = new Date("2026-11-06T10:00:00Z");

afterAll(async () => {
  await prisma.$disconnect();
});

async function paidInvoice(customerId: string, amount: number, paidAt: Date) {
  const order = await prisma.order.create({
    data: {
      type: "REPAIR",
      customerId,
      status: "DONE",
      total: amount,
      completedAt: paidAt,
      createdById: (await prisma.employee.findFirstOrThrow()).id,
    },
  });

  return prisma.invoice.create({
    data: { orderId: order.id, amount, status: "PAID", paidAt, issuedById: order.createdById },
  });
}

describe("Dashboard", () => {
  it("Umsatz heute zählt nur den Berliner Tag", async () => {
    const ctx = await makeCtx({ permissions: [] });
    const customer = await createCustomer();

    // 23:30 UTC am 5.11. ist schon der 6.11. in Berlin, 22:30 UTC gehört noch zum 5.11.
    await paidInvoice(customer.id, 500, new Date("2026-11-05T23:30:00Z"));
    await paidInvoice(customer.id, 300, new Date("2026-11-05T22:30:00Z"));

    const stats = await getDashboardStats(NOW);
    expect(stats.revenueToday).toBe(500);
    expect(ctx.username).toBeTruthy();
  });

  it("offene Aufträge sind OPEN und IN_PROGRESS", async () => {
    const ctx = await makeCtx({ permissions: [] });
    const customer = await createCustomer();
    const employee = await prisma.employee.findUniqueOrThrow({ where: { id: ctx.employeeId } });

    for (const status of ["OPEN", "IN_PROGRESS", "DONE", "CANCELLED"] as const) {
      await prisma.order.create({ data: { type: "REPAIR", customerId: customer.id, status, createdById: employee.id } });
    }

    expect((await getDashboardStats(NOW)).openOrders).toBe(2);
  });

  it("knappe Teile", async () => {
    await makeCtx({ permissions: [] });
    await createPart({ name: "Knapptes Teil", stock: 2, minStock: 5 });
    await createPart({ name: "Volles Teil", stock: 10, minStock: 5 });

    expect((await getDashboardStats(NOW)).lowStockParts).toBe(1);
  });

  it("aktive Mitarbeiter und die Dienstliste", async () => {
    const ctx = await makeCtx({ permissions: [] });
    const other = await createEmployeeForRank(ctx.rank.id);

    await prisma.timeEntry.create({
      data: { employeeId: other.id, clockIn: new Date(NOW.getTime() - 90 * 60_000) },
    });

    const stats = await getDashboardStats(NOW);
    expect(stats.onDuty.count).toBe(1);
    expect(stats.onDuty.total).toBeGreaterThanOrEqual(2);

    const list = await getOnDutyList(NOW);
    expect(list).toHaveLength(1);
    expect(list[0]!.minutes).toBe(90);
    expect(list[0]!.employeeId).toBe(other.id);
  });

  it("sieben Tage Umsatz, fehlende Tage mit 0", async () => {
    await makeCtx({ permissions: [] });
    const customer = await createCustomer();
    await paidInvoice(customer.id, 700, new Date("2026-11-03T12:00:00Z"));

    const days = await getRevenueLast7Days(NOW);
    expect(days).toHaveLength(7);
    expect(days.map((d) => d.label)).toEqual(["31.10.", "01.11.", "02.11.", "03.11.", "04.11.", "05.11.", "06.11."]);
    expect(days[3]!.revenue).toBe(700);
    expect(days[0]!.revenue).toBe(0);
  });

  it("letzte Aufträge", async () => {
    const ctx = await makeCtx({ permissions: [] });
    const customer = await createCustomer({ plates: ["DASHBOARD"] });

    const order = await prisma.order.create({
      data: {
        type: "REPAIR",
        customerId: customer.id,
        status: "OPEN",
        total: 120,
        createdById: ctx.employeeId,
        vehicleId: (await prisma.vehicle.findFirstOrThrow({ where: { customerId: customer.id } })).id,
      },
    });

    const rows = await getRecentOrders(10);
    expect(rows[0]!.number).toBe(order.number);
    expect(rows[0]!.customer).toBe(customer.name);
    expect(rows[0]!.plate).toBe("DASHBOARD");
  });
});
