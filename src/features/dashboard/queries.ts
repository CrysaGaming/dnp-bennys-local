import { prisma } from "@/lib/prisma";
import { berlinDayStart, lastNDaysBerlin } from "./days";

export type DashboardStats = {
  openOrders: number;
  revenueToday: number;
  onDuty: { count: number; total: number };
  lowStockParts: number;
};

export type RevenueDay = { label: string; revenue: number };

export type OnDutyRow = {
  employeeId: string;
  name: string;
  image: string | null;
  rankColor: string;
  minutes: number;
};

export type RecentOrder = {
  number: number;
  customer: string;
  plate: string | null;
  status: string;
  total: number;
  createdAt: Date;
};

/** Kennzahlen (Spec 5.1). Offene Aufträge sind OPEN und IN_PROGRESS. */
export async function getDashboardStats(now: Date = new Date()): Promise<DashboardStats> {
  const todayStart = berlinDayStart(now);

  const openOrders = await prisma.order.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } });

  const revenue = await prisma.invoice.aggregate({
    _sum: { amount: true },
    where: { status: "PAID", paidAt: { gte: todayStart } },
  });

  const openEntries = await prisma.timeEntry.findMany({
    where: { clockOut: null },
    select: { employeeId: true },
  });

  const activeEmployees = await prisma.employee.count({ where: { status: "ACTIVE" } });

  // Prisma kann stock nicht gegen minStock vergleichen – zwei Spalten derselben Zeile.
  const parts = await prisma.part.findMany({ select: { stock: true, minStock: true } });

  return {
    openOrders,
    revenueToday: revenue._sum.amount ?? 0,
    onDuty: {
      count: new Set(openEntries.map((entry) => entry.employeeId)).size,
      total: activeEmployees,
    },
    lowStockParts: parts.filter((part) => part.stock < part.minStock).length,
  };
}

export async function getRevenueLast7Days(now: Date = new Date()): Promise<RevenueDay[]> {
  const days = lastNDaysBerlin(7, now);

  const rows = await prisma.invoice.findMany({
    where: { status: "PAID", paidAt: { gte: days[0]!.start, lte: days[6]!.end } },
    select: { amount: true, paidAt: true },
  });

  const buckets = new Map<number, number>();

  for (const row of rows) {
    if (!row.paidAt) continue;
    const key = berlinDayStart(row.paidAt).getTime();
    buckets.set(key, (buckets.get(key) ?? 0) + row.amount);
  }

  return days.map((day) => ({ label: day.label, revenue: buckets.get(day.start.getTime()) ?? 0 }));
}

export async function getOnDutyList(now: Date = new Date()): Promise<OnDutyRow[]> {
  const rows = await prisma.timeEntry.findMany({
    where: { clockOut: null },
    include: {
      employee: { include: { user: { select: { name: true, image: true } }, rank: { select: { color: true } } } },
    },
    orderBy: { clockIn: "asc" },
  });

  return rows.map((row) => ({
    employeeId: row.employeeId,
    name: row.employee.user.name,
    image: row.employee.user.image ?? null,
    rankColor: row.employee.rank.color,
    minutes: Math.max(0, Math.round((now.getTime() - row.clockIn.getTime()) / 60_000)),
  }));
}

export async function getRecentOrders(limit = 10, now: Date = new Date()): Promise<RecentOrder[]> {
  const rows = await prisma.order.findMany({
    where: { createdAt: { lte: now } },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { customer: true, vehicle: true },
  });

  return rows.map((row) => ({
    number: row.number,
    customer: row.customer.name,
    plate: row.vehicle?.plate ?? null,
    status: row.status,
    total: row.total,
    createdAt: row.createdAt,
  }));
}
