import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { ForbiddenError } from "@/lib/errors";
import { makeCtx } from "@tests/helpers/factories";
import { clockIn, clockOut, correctEntry, getOpenEntry, listEntries } from "@/features/time/service";

describe("time", () => {
  it("doppeltes Einstempeln scheitert", async () => {
    // Review Focus 2
    const ctx = await makeCtx({ permissions: [] });

    const results = await Promise.allSettled([clockIn(ctx), clockIn(ctx)]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);

    await expect(clockIn(ctx)).rejects.toThrow("Du bist bereits eingestempelt.");
  });

  it("Ausstempeln ohne offenen Eintrag", async () => {
    const ctx = await makeCtx({ permissions: [] });

    await expect(clockOut(ctx)).rejects.toThrow("Du bist nicht eingestempelt.");
  });

  it("stempelt ein und aus", async () => {
    const ctx = await makeCtx({ permissions: [] });

    const entry = await clockIn(ctx);
    expect(entry.clockOut).toBeNull();
    expect((await getOpenEntry(ctx))?.id).toBe(entry.id);

    const closed = await clockOut(ctx);
    expect(closed.clockOut).not.toBeNull();
    expect(await getOpenEntry(ctx)).toBeNull();
  });

  it("Korrektur braucht TIMES_MANAGE und setzt editedById plus Audit", async () => {
    const chef = await makeCtx({ permissions: ["TIMES_MANAGE"], level: 50 });
    const target = await makeCtx({ permissions: [], level: 20 });
    const entry = await clockIn(target);

    await correctEntry(chef, entry.id, {
      clockIn: new Date("2026-11-05T09:00:00Z"),
      clockOut: new Date("2026-11-05T12:00:00Z"),
      note: "Vergessen auszustempeln",
    });

    const saved = await prisma.timeEntry.findUniqueOrThrow({ where: { id: entry.id } });
    expect(saved.editedById).toBe(chef.employeeId);
    expect(saved.clockIn.toISOString()).toBe("2026-11-05T09:00:00.000Z");
    expect(saved.note).toBe("Vergessen auszustempeln");

    const audit = await prisma.auditLog.findFirstOrThrow({ where: { action: "time.correct" } });
    expect(audit).toMatchObject({ actorId: chef.userId, entity: "time_entry", entityId: entry.id });
  });

  it("Ende vor Beginn", async () => {
    const chef = await makeCtx({ permissions: ["TIMES_MANAGE"], level: 50 });
    const target = await makeCtx({ permissions: [], level: 20 });
    const entry = await clockIn(target);

    await expect(
      correctEntry(chef, entry.id, {
        clockIn: new Date("2026-11-05T12:00:00Z"),
        clockOut: new Date("2026-11-05T09:00:00Z"),
        note: "Falsch herum",
      }),
    ).rejects.toThrow(ZodError);
  });

  it("fremde Zeiten nur mit TIMES_VIEW_ALL", async () => {
    const viewer = await makeCtx({ permissions: [], level: 20 });
    const weekStart = new Date("2026-11-02T00:00:00Z");

    await expect(listEntries(viewer, { employeeId: viewer.employeeId, weekStart })).resolves.toBeInstanceOf(Array);
    await expect(listEntries(viewer, { employeeId: "irgendein anderer", weekStart })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("Korrektur nur für Ränge unter dem eigenen", async () => {
    const chef = await makeCtx({ permissions: ["TIMES_MANAGE"], level: 50 });
    const equal = await makeCtx({ permissions: [], level: 60 });
    const entry = await clockIn(equal);

    await expect(
      correctEntry(chef, entry.id, {
        clockIn: new Date("2026-11-05T09:00:00Z"),
        clockOut: new Date("2026-11-05T12:00:00Z"),
        note: "Nicht erlaubt",
      }),
    ).rejects.toThrow("Du kannst nur Zeiten unter deinem Rang korrigieren.");
  });
});
