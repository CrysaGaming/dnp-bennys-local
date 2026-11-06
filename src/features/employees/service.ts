import { randomUUID } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { internalEmail } from "@/lib/auth-email";
import { writeAudit } from "@/lib/audit";
import { assertPermission, outranks } from "@/lib/permissions";
import { BusinessRuleError, ConflictError, NotFoundError } from "@/lib/errors";
import { sumMinutes, weekStartBerlin } from "@/features/time/calc";
import { EmployeeStatus } from "@/generated/prisma/enums";
import type { SessionContext } from "@/lib/session-types";
import { employeeCreateSchema, employeeUpdateSchema } from "./schemas";
import { generateStartPassword } from "./password";

export type EmployeeRow = {
  id: string;
  name: string;
  username: string;
  serviceNumber: number;
  phone: string | null;
  status: EmployeeStatus;
  rank: { id: string; name: string; color: string; level: number; hourlyWage: number };
  image: string | null;
  /** Minuten dieser Woche in Berlin – für die Liste (Spec 5.6). */
  minutesThisWeek: number;
};

/** Unique-Fehler (P2002) den Feldern zuordnen – Prisma 7 nennt den Index der Meldung. */
function conflict(e: unknown): ConflictError | null {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== "P2002") return null;

  const index =
    (e.meta as { driverAdapterError?: { cause?: { constraint?: { index?: string } } } })?.driverAdapterError
      ?.cause?.constraint?.index ?? "";

  // Der User hat zwei Unique-Felder, die bei derselben Eingabe beide getroffen werden
  // können: `username` und die daraus abgeleitete interne `email`. Beide gehören zum
  //selben Feld des Formulars.
  if (index === "user_username_key" || index === "user_email_key") {
    return new ConflictError("username", "Benutzername ist vergeben");
  }
  if (index === "employee_serviceNumber_key") return new ConflictError("serviceNumber", "Dienstnummer ist vergeben");

  return null;
}

/** „Admin“ ist ein Employee im System-Rang mit Status ACTIVE (Spec 3.5 / Plan 03). */
async function isLastActiveAdmin(tx: Prisma.TransactionClient, employeeId: string): Promise<boolean> {
  const target = await tx.employee.findUniqueOrThrow({ where: { id: employeeId }, include: { rank: true } });
  if (!target.rank.isSystem) return false;

  const active = await tx.employee.count({
    where: { status: EmployeeStatus.ACTIVE, rank: { isSystem: true } },
  });

  return active <= 1;
}

function assertManagesUnder(ctx: SessionContext, level: number): void {
  if (!outranks(ctx, level)) {
    throw new BusinessRuleError("Du kannst nur Mitarbeiter unter deinem Rang verwalten.");
  }
}

export async function listEmployees(
  ctx: SessionContext,
  filter: { rankId?: string; status?: EmployeeStatus } = {},
): Promise<EmployeeRow[]> {
  assertPermission(ctx, "EMPLOYEES_VIEW");

  const employees = await prisma.employee.findMany({
    where: { rankId: filter.rankId, status: filter.status },
    include: { user: true, rank: true, timeEntries: true },
    orderBy: { serviceNumber: "asc" },
  });

  const weekStart = weekStartBerlin(new Date());
  const now = new Date();

  return employees.map((e) => ({
    id: e.id,
    // Der Name steht am User, die Stunden kommen aus der Stempeluhr (Spec 7.3 / 5.6).
    name: e.user.name,
    username: e.user.username ?? "",
    serviceNumber: e.serviceNumber,
    phone: e.phone,
    status: e.status,
    rank: {
      id: e.rank.id,
      name: e.rank.name,
      color: e.rank.color,
      level: e.rank.level,
      hourlyWage: e.rank.hourlyWage,
    },
    image: e.user.image,
    minutesThisWeek: sumMinutes(
      e.timeEntries.filter((entry) => entry.clockIn >= weekStart),
      now,
    ),
  }));
}

/**
 * Anlegen – alles in einer Transaktion, damit kein verwaister User steht, wenn die
 * Dienstnummer schon vergeben ist (Spec 3.5). Das Startpasswort wird nur einmal gezeigt.
 */
export async function createEmployee(
  ctx: SessionContext,
  input: unknown,
): Promise<{ employeeId: string; startPassword: string }> {
  assertPermission(ctx, "EMPLOYEES_MANAGE");

  const data = employeeCreateSchema.parse(input);

  const rank = await prisma.rank.findUnique({ where: { id: data.rankId } });
  if (!rank) throw new NotFoundError();
  assertManagesUnder(ctx, rank.level);

  const startPassword = generateStartPassword();
  const hash = await (await auth.$context).password.hash(startPassword);

  try {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          id: randomUUID(),
          name: data.name,
          email: internalEmail(data.username),
          username: data.username,
          role: "user",
        },
      });

      const employee = await tx.employee.create({
        data: {
          userId: user.id,
          rankId: rank.id,
          serviceNumber: data.serviceNumber,
          phone: data.phone ?? null,
          mustChangePassword: true,
        },
      });

      await tx.account.create({
        data: { id: randomUUID(), accountId: user.id, providerId: "credential", userId: user.id, password: hash },
      });

      await writeAudit(tx, {
        actorId: ctx.userId,
        action: "employee.create",
        entity: "employee",
        entityId: employee.id,
        data: { username: data.username, serviceNumber: data.serviceNumber, rankId: rank.id },
      });

      return { employeeId: employee.id, startPassword };
    });
  } catch (e) {
    const c = conflict(e);
    if (c) throw c;
    throw e;
  }
}

export async function updateEmployee(ctx: SessionContext, id: string, input: unknown): Promise<void> {
  assertPermission(ctx, "EMPLOYEES_MANAGE");

  const data = employeeUpdateSchema.parse(input);

  try {
    await prisma.$transaction(async (tx) => {
      const target = await tx.employee.findUnique({ where: { id }, include: { rank: true, user: true } });
      if (!target) throw new NotFoundError();

      const newRank = await tx.rank.findUnique({ where: { id: data.rankId } });
      if (!newRank) throw new NotFoundError();

      assertManagesUnder(ctx, target.rank.level);
      assertManagesUnder(ctx, newRank.level);

      // Der letzte Admin darf seinen System-Rang nicht verlieren (Review Focus 5).
      if (target.rank.isSystem && !newRank.isSystem && (await isLastActiveAdmin(tx, id))) {
        throw new BusinessRuleError("Der letzte Admin kann nicht herabgestuft werden.");
      }

      // Der Name gehört zum User, die übrigen Felder zum Employee (Spec 7.3).
      await tx.user.update({ where: { id: target.userId }, data: { name: data.name } });
      await tx.employee.update({
        where: { id },
        data: {
          rankId: newRank.id,
          serviceNumber: data.serviceNumber,
          phone: data.phone ?? null,
          status: data.status,
          notes: data.notes ?? null,
        },
      });

      await writeAudit(tx, {
        actorId: ctx.userId,
        action: "employee.update",
        entity: "employee",
        entityId: id,
        data: {
          before: { name: target.user.name, rankId: target.rank.id, status: target.status },
          after: { name: data.name, rankId: newRank.id, status: data.status },
        },
      });
    });
  } catch (e) {
    const c = conflict(e);
    if (c) throw c;
    throw e;
  }
}

/** Sperren statt löschen (AGENTS.md): Status, Flag, Bann, Sessions weg. */
export async function terminateEmployee(ctx: SessionContext, id: string, reason: string | null): Promise<void> {
  assertPermission(ctx, "EMPLOYEES_MANAGE");

  await prisma.$transaction(async (tx) => {
    const target = await tx.employee.findUnique({ where: { id }, include: { rank: true, user: true } });
    if (!target) throw new NotFoundError();

    // Reihenfolge: zuerst der Schutz des letzten Admins (Review Focus 5), dann das
    // Verbot, sich selbst zu sperren, dann die Rang-Hierarchie.
    if (await isLastActiveAdmin(tx, id)) {
      throw new BusinessRuleError("Der letzte Admin kann nicht gesperrt werden.");
    }

    if (id === ctx.employeeId) {
      throw new BusinessRuleError("Du kannst dich nicht selbst sperren.");
    }

    assertManagesUnder(ctx, target.rank.level);

    await tx.employee.update({
      where: { id },
      data: { status: EmployeeStatus.TERMINATED, terminatedAt: new Date(), notes: reason },
    });

    await tx.user.update({ where: { id: target.userId }, data: { banned: true, banReason: reason ?? null } });
    await tx.session.deleteMany({ where: { userId: target.userId } });

    await writeAudit(tx, {
      actorId: ctx.userId,
      action: "employee.terminate",
      entity: "employee",
      entityId: id,
      data: { reason: reason ?? null },
    });
  });
}

export async function resetEmployeePassword(
  ctx: SessionContext,
  id: string,
): Promise<{ startPassword: string }> {
  assertPermission(ctx, "EMPLOYEES_MANAGE");

  const target = await prisma.employee.findUnique({ where: { id }, include: { rank: true } });
  if (!target) throw new NotFoundError();
  assertManagesUnder(ctx, target.rank.level);

  const context = await auth.$context;
  const startPassword = generateStartPassword();
  const hash = await context.password.hash(startPassword);

  await prisma.$transaction(async (tx) => {
    const account = await tx.account.findFirst({ where: { userId: target.userId, providerId: "credential" } });

    if (account) {
      await tx.account.update({ where: { id: account.id }, data: { password: hash } });
    }

    await tx.employee.update({ where: { id }, data: { mustChangePassword: true } });
    await tx.session.deleteMany({ where: { userId: target.userId } });

    await writeAudit(tx, {
      actorId: ctx.userId,
      action: "employee.password_reset",
      entity: "employee",
      entityId: id,
    });
  });

  return { startPassword };
}
