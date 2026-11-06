import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { assertPermission } from "@/lib/permissions";
import { BusinessRuleError, ConflictError, NotFoundError } from "@/lib/errors";
import type { SessionContext } from "@/lib/session-types";
import type { RewardRow } from "./reward-types";
import {
  adjustSchema,
  loyaltySettingsSchema,
  rewardSchema,
  type LoyaltySettingsInput,
  type RewardInput,
} from "./schemas";
import { bookLoyalty } from "./ledger";

const MODE_GUARD = "Modus kann nur gewechselt werden, solange kein Kunde Guthaben hat.";
const REWARD_CONFLICT = "Diese Prämie gibt es schon";

/** Für die Einstellungsseite: der Grund, warum der Modus gesperrt ist, muss sichtbar sein. */
export async function countCustomersWithBalance(): Promise<number> {
  return prisma.customer.count({ where: { loyaltyBalance: { gt: 0 } } });
}

/** Die Singleton-Zeile kann fehlen, wenn der Seed nicht gelaufen ist – liefern auf jeden Fall. */
export async function getLoyaltySettings() {
  return prisma.loyaltySettings.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });
}

export async function updateLoyaltySettings(ctx: SessionContext, input: LoyaltySettingsInput) {
  assertPermission(ctx, "LOYALTY_MANAGE");

  const data = loyaltySettingsSchema.parse(input);
  const current = await getLoyaltySettings();

  // Aus 7 Stempeln würden plötzlich 7 Punkte – das ist nur ohne Guthaben ungefährlich.
  if (data.mode !== current.mode) {
    const withBalance = await prisma.customer.count({ where: { loyaltyBalance: { gt: 0 } } });
    if (withBalance > 0) throw new BusinessRuleError(MODE_GUARD);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.loyaltySettings.update({ where: { id: 1 }, data });

    await writeAudit(tx, {
      actorId: ctx.userId,
      action: "loyalty.settings",
      entity: "loyalty_settings",
      entityId: String(1),
      data: { before: current, after: updated },
    });

    return updated;
  });
}

export async function listRewards(ctx: SessionContext, opts: { includeInactive?: boolean } = {}): Promise<RewardRow[]> {
  assertPermission(ctx, "CUSTOMERS_VIEW");

  const rows = await prisma.loyaltyReward.findMany({
    where: opts.includeInactive ? undefined : { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { priceListItem: { select: { name: true } } },
  });

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    type: r.type,
    value: r.value,
    cost: r.cost,
    active: r.active,
    sortOrder: r.sortOrder,
    itemName: r.priceListItem?.name ?? null,
  }));
}

export async function createReward(ctx: SessionContext, input: RewardInput) {
  assertPermission(ctx, "LOYALTY_MANAGE");

  const data = rewardSchema.parse(input);

  if (data.priceListItemId) {
    const item = await prisma.priceListItem.findUnique({ where: { id: data.priceListItemId } });
    if (!item) throw new NotFoundError("Leistung nicht gefunden.");
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const created = await tx.loyaltyReward.create({ data });

      await writeAudit(tx, {
        actorId: ctx.userId,
        action: "loyalty.reward.create",
        entity: "loyalty_reward",
        entityId: created.id,
        data: { name: created.name, type: created.type, cost: created.cost },
      });

      return created;
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new ConflictError("name", REWARD_CONFLICT);
    }
    throw e;
  }
}

export async function updateReward(ctx: SessionContext, id: string, input: RewardInput) {
  assertPermission(ctx, "LOYALTY_MANAGE");

  const data = rewardSchema.parse(input);

  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.loyaltyReward.findUnique({ where: { id } });
      if (!existing) throw new NotFoundError("Prämie nicht gefunden.");

      const updated = await tx.loyaltyReward.update({ where: { id }, data });

      await writeAudit(tx, {
        actorId: ctx.userId,
        action: "loyalty.reward.update",
        entity: "loyalty_reward",
        entityId: id,
        data: { before: { name: existing.name, cost: existing.cost }, after: { name: updated.name, cost: updated.cost } },
      });

      return updated;
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      throw new NotFoundError("Prämie nicht gefunden.");
    }
    throw e;
  }
}

export async function setRewardActive(ctx: SessionContext, id: string, active: boolean) {
  assertPermission(ctx, "LOYALTY_MANAGE");

  try {
    return await prisma.$transaction(async (tx) => {
      const updated = await tx.loyaltyReward.update({ where: { id }, data: { active } });

      await writeAudit(tx, {
        actorId: ctx.userId,
        action: "loyalty.reward.active",
        entity: "loyalty_reward",
        entityId: id,
        data: { active },
      });

      return updated;
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      throw new NotFoundError("Prämie nicht gefunden.");
    }
    throw e;
  }
}

/** Manuelle Korrektur (Spec 3.6): Notiz ist Pflicht, das Konto wird nie negativ. */
export async function adjustLoyalty(ctx: SessionContext, input: unknown) {
  assertPermission(ctx, "LOYALTY_MANAGE");

  const data = adjustSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const before = await tx.customer.findUnique({ where: { id: data.customerId } });
    if (!before) throw new NotFoundError("Kunde nicht gefunden.");

    const after = await bookLoyalty(tx, {
      customerId: data.customerId,
      type: "ADJUSTMENT",
      amount: data.amount,
      employeeId: ctx.employeeId,
      note: data.note,
    });

    await writeAudit(tx, {
      actorId: ctx.userId,
      action: "loyalty.adjust",
      entity: "customer",
      entityId: data.customerId,
      data: { before: before.loyaltyBalance, after: after.balanceAfter, note: data.note },
    });

    return { balanceBefore: before.loyaltyBalance, balanceAfter: after.balanceAfter };
  });
}
