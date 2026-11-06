import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  adjustLoyalty,
  createReward,
  listRewards,
  setRewardActive,
  updateLoyaltySettings,
} from "@/features/loyalty/service";
import { rewardSchema } from "@/features/loyalty/schemas";
import { bookLoyalty } from "@/features/loyalty/ledger";
import { ForbiddenError, InsufficientLoyaltyError, NotFoundError } from "@/lib/errors";
import { createCustomer, createPriceItem } from "@tests/helpers/factories";
import { makeCtx } from "@tests/helpers/factories";

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Treue", () => {
  it("Moduswechsel ist gesperrt, solange ein Kunde Guthaben hat", async () => {
    const ctx = await makeCtx({ permissions: ["LOYALTY_MANAGE"] });
    const customer = await createCustomer({ name: "Mit Guthaben" });

    await prisma.customer.update({ where: { id: customer.id }, data: { loyaltyBalance: 1 } });

    await expect(updateLoyaltySettings(ctx, { mode: "POINTS" })).rejects.toThrow(
      "Modus kann nur gewechselt werden, solange kein Kunde Guthaben hat.",
    );

    await prisma.customer.update({ where: { id: customer.id }, data: { loyaltyBalance: 0 } });

    const settings = await updateLoyaltySettings(ctx, { mode: "POINTS" });
    expect(settings.mode).toBe("POINTS");

    const audit = await prisma.auditLog.findFirst({ where: { action: "loyalty.settings" } });
    expect(audit).not.toBeNull();
  });

  it("FREE_SERVICE braucht eine Leistung", async () => {
    const ctx = await makeCtx({ permissions: ["LOYALTY_MANAGE"] });

    await expect(
      createReward(ctx, { name: "Gratis Ölwechsel", type: "FREE_SERVICE", value: 0, cost: 10 }),
    ).rejects.toThrow("Bitte eine Leistung wählen");

    const category = await prisma.priceCategory.create({ data: { name: "Testkat" } });
    const item = await createPriceItem({ name: "Ölwechsel", price: 250, categoryId: category.id });

    const reward = await createReward(ctx, {
      name: "Gratis Ölwechsel",
      type: "FREE_SERVICE",
      value: 0,
      cost: 10,
      priceListItemId: item.id,
    });

    expect(reward.priceListItemId).toBe(item.id);
  });

  it("Wert passt zur Prämienart", () => {
    expect(
      rewardSchema.safeParse({ name: "Rabatt", type: "PERCENT_DISCOUNT", value: 150, cost: 10 }).success,
    ).toBe(false);

    expect(
      rewardSchema.safeParse({ name: "Rabatt", type: "PERCENT_DISCOUNT", value: 20, cost: 10 }).success,
    ).toBe(true);
  });

  it("Abzug über das Guthaben scheitert ohne Buchung", async () => {
    const ctx = await makeCtx({ permissions: ["LOYALTY_MANAGE"] });
    const customer = await createCustomer({ name: "Dreißig" });

    await prisma.customer.update({ where: { id: customer.id }, data: { loyaltyBalance: 3 } });

    await expect(adjustLoyalty(ctx, { customerId: customer.id, amount: -5, note: "Fehlerfall" })).rejects.toThrow(
      InsufficientLoyaltyError,
    );

    const stored = await prisma.customer.findUniqueOrThrow({ where: { id: customer.id } });
    expect(stored.loyaltyBalance).toBe(3);
    expect(await prisma.loyaltyTransaction.count({ where: { customerId: customer.id } })).toBe(0);
  });

  it("manuelle Gutschrift mit Notiz, Notiz mindestens drei Zeichen", async () => {
    const ctx = await makeCtx({ permissions: ["LOYALTY_MANAGE"] });
    const customer = await createCustomer({ name: "Papierkarte" });

    const result = await adjustLoyalty(ctx, {
      customerId: customer.id,
      amount: 7,
      note: "Papierkarte übertragen",
    });

    expect(result.balanceAfter).toBe(7);

    const booking = await prisma.loyaltyTransaction.findFirstOrThrow({ where: { customerId: customer.id } });
    expect(booking.type).toBe("ADJUSTMENT");
    expect(booking.amount).toBe(7);
    expect(booking.employeeId).toBe(ctx.employeeId);

    await expect(adjustLoyalty(ctx, { customerId: customer.id, amount: 1, note: "ab" })).rejects.toThrow(
      "Notiz: mindestens 3 Zeichen",
    );
  });

  it("zwei Einlösungen zur selben Zeit: eine bekommt den Zuschlag (Review Focus 2)", async () => {
    const ctx = await makeCtx({ permissions: ["LOYALTY_MANAGE"] });
    const customer = await createCustomer({ name: "Doppel" });

    await prisma.customer.update({ where: { id: customer.id }, data: { loyaltyBalance: 5 } });

    const results = await Promise.allSettled([
      prisma.$transaction((tx) =>
        bookLoyalty(tx, { customerId: customer.id, type: "REDEEM", amount: -3, employeeId: ctx.employeeId }),
      ),
      prisma.$transaction((tx) =>
        bookLoyalty(tx, { customerId: customer.id, type: "REDEEM", amount: -3, employeeId: ctx.employeeId }),
      ),
    ]);

    const ok = results.filter((r) => r.status === "fulfilled");
    const failed = results.filter((r) => r.status === "rejected");

    expect(ok).toHaveLength(1);
    expect(failed).toHaveLength(1);
    expect((failed[0] as PromiseRejectedResult).reason).toBeInstanceOf(InsufficientLoyaltyError);

    const stored = await prisma.customer.findUniqueOrThrow({ where: { id: customer.id } });
    expect(stored.loyaltyBalance).toBe(2);
    expect(await prisma.loyaltyTransaction.count({ where: { customerId: customer.id } })).toBe(1);
  });

  it("Besuch setzt den letzten Besuch, ohne negative Konten", async () => {
    const ctx = await makeCtx({ permissions: ["LOYALTY_MANAGE"] });
    const customer = await createCustomer({ name: "Besuch" });

    const visitAt = new Date("2026-11-05T10:00:00Z");

    await prisma.$transaction(async (tx) => {
      await bookLoyalty(tx, {
        customerId: customer.id,
        type: "EARN",
        amount: 4,
        employeeId: ctx.employeeId,
        visitAt,
      });
    });

    const stored = await prisma.customer.findUniqueOrThrow({ where: { id: customer.id } });
    expect(stored.loyaltyBalance).toBe(4);
    expect(stored.lastVisitAt?.toISOString()).toBe(visitAt.toISOString());
  });

  it("ohne LOYALTY_MANAGE ist alles Schreiben verboten, Lesen darf man", async () => {
    const reader = await makeCtx({ permissions: ["CUSTOMERS_VIEW"] });
    const writer = await makeCtx({ permissions: ["CUSTOMERS_VIEW", "LOYALTY_MANAGE"] });
    const customer = await createCustomer({ name: "Nur Leser" });

    const reward = await createReward(writer, { name: "Fünf Dollar", type: "FIXED_DISCOUNT", value: 5, cost: 5 });

    expect((await listRewards(reader)).map((r) => r.name)).toContain(reward.name);

    await expect(adjustLoyalty(reader, { customerId: customer.id, amount: 1, note: "Zuschreiben" })).rejects.toThrow(
      ForbiddenError,
    );
    await expect(createReward(reader, { name: "Noch eine", type: "PERCENT_DISCOUNT", value: 10, cost: 5 })).rejects.toThrow(
      ForbiddenError,
    );
    await expect(updateLoyaltySettings(reader, { mode: "POINTS" })).rejects.toThrow(ForbiddenError);
    await expect(setRewardActive(reader, reward.id, false)).rejects.toThrow(ForbiddenError);
  });

  it("inaktive Prämien nur mit Schalter", async () => {
    const ctx = await makeCtx({ permissions: ["LOYALTY_MANAGE"] });

    const reward = await createReward(ctx, { name: "Fünf Dollar", type: "FIXED_DISCOUNT", value: 5, cost: 5 });
    await setRewardActive(ctx, reward.id, false);

    expect(await listRewards(ctx)).toHaveLength(0);
    expect(await listRewards(ctx, { includeInactive: true })).toHaveLength(1);

    await expect(setRewardActive(ctx, "fehlt", true)).rejects.toThrow(NotFoundError);
  });
});
