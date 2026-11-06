import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { assertPermission, outranks } from "@/lib/permissions";
import { BusinessRuleError, NotFoundError } from "@/lib/errors";
import type { TimeEntry } from "@/generated/prisma/client";
import type { SessionContext } from "@/lib/session-types";
import { correctEntrySchema } from "./schemas";

/** Pro Mitarbeiter darf genau ein offener Eintrag stehen (Partial-Index, Spec 7.4). */
export async function getOpenEntry(ctx: SessionContext): Promise<TimeEntry | null> {
  return prisma.timeEntry.findFirst({ where: { employeeId: ctx.employeeId, clockOut: null } });
}

function p2002(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

export async function clockIn(ctx: SessionContext): Promise<TimeEntry> {
  try {
    return await prisma.$transaction(async (tx) => {
      const entry = await tx.timeEntry.create({ data: { employeeId: ctx.employeeId } });

      await writeAudit(tx, {
        actorId: ctx.userId,
        action: "time.clock_in",
        entity: "time_entry",
        entityId: entry.id,
      });

      return entry;
    });
  } catch (e) {
    // Der Partial-Index ist die eigentliche Grenze: zwei Tabs oder ein Doppelklick
    // können sonst zwei offene Einträge erzeugen (Review Focus 2).
    if (p2002(e)) throw new BusinessRuleError("Du bist bereits eingestempelt.");
    throw e;
  }
}

export async function clockOut(ctx: SessionContext): Promise<TimeEntry> {
  const open = await prisma.timeEntry.findFirst({ where: { employeeId: ctx.employeeId, clockOut: null } });
  if (!open) throw new BusinessRuleError("Du bist nicht eingestempelt.");

  return prisma.$transaction(async (tx) => {
    const entry = await tx.timeEntry.update({ where: { id: open.id }, data: { clockOut: new Date() } });

    await writeAudit(tx, {
      actorId: ctx.userId,
      action: "time.clock_out",
      entity: "time_entry",
      entityId: entry.id,
      data: { minutes: Math.floor((entry.clockOut!.getTime() - entry.clockIn.getTime()) / 60000) },
    });

    return entry;
  });
}

/** Korrigieren darf nur, wer TIMES_MANAGE hat und über dem Rang des Ziels steht (Spec 5.7). */
export async function correctEntry(
  ctx: SessionContext,
  id: string,
  input: { clockIn: Date; clockOut: Date | null; note: string },
): Promise<void> {
  assertPermission(ctx, "TIMES_MANAGE");

  const data = correctEntrySchema.parse(input);

  await prisma.$transaction(async (tx) => {
    const entry = await tx.timeEntry.findUnique({ where: { id }, include: { employee: { include: { rank: true } } } });
    if (!entry) throw new NotFoundError();

    if (entry.employeeId !== ctx.employeeId && !outranks(ctx, entry.employee.rank.level)) {
      throw new BusinessRuleError("Du kannst nur Zeiten unter deinem Rang korrigieren.");
    }

    await tx.timeEntry.update({
      where: { id },
      data: { clockIn: data.clockIn, clockOut: data.clockOut, note: data.note, editedById: ctx.employeeId },
    });

    await writeAudit(tx, {
      actorId: ctx.userId,
      action: "time.correct",
      entity: "time_entry",
      entityId: id,
      data: {
        before: { clockIn: entry.clockIn, clockOut: entry.clockOut, note: entry.note },
        after: { clockIn: data.clockIn, clockOut: data.clockOut, note: data.note },
      },
    });
  });
}

/** Eigene Zeiten darf jeder sehen, fremde nur mit TIMES_VIEW_ALL (Spec 5.7). */
export async function listEntries(
  ctx: SessionContext,
  q: { employeeId?: string; weekStart: Date },
): Promise<TimeEntry[]> {
  if (q.employeeId && q.employeeId !== ctx.employeeId) {
    assertPermission(ctx, "TIMES_VIEW_ALL");
  }

  return prisma.timeEntry.findMany({
    where: { employeeId: q.employeeId ?? ctx.employeeId, clockIn: { gte: q.weekStart } },
    orderBy: { clockIn: "asc" },
  });
}

import { sumMinutes } from "./calc";

/** Summe für die Liste und die Lohn-Vorschau (Spec 5.6) – dieselbe Rechnung wie in calc. */
export async function minutesThisWeek(ctx: SessionContext, employeeId: string, weekStart: Date): Promise<number> {
  const entries = await prisma.timeEntry.findMany({
    where: { employeeId, clockIn: { gte: weekStart } },
  });

  return sumMinutes(entries, new Date());
}
