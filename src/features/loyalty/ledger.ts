import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import type { LoyaltyTxType } from "@/generated/prisma/enums";
import { InsufficientLoyaltyError, NotFoundError } from "@/lib/errors";

const txType = z.enum(["EARN", "REDEEM", "REVERSAL", "ADJUSTMENT"]);

export type BookLoyaltyInput = {
  customerId: string;
  type: LoyaltyTxType;
  amount: number;
  employeeId: string;
  orderId?: string;
  invoiceId?: string;
  rewardId?: string;
  note?: string;
  visitAt?: Date;
};

/**
 * Einziger Weg auf das Treuekonto (Spec 3.6). Der Abzug ist ein bedingtes Update: zwei
 * Einlösungen desselben Betrages lassen genau eine durch, das Konto wird nie negativ – ein
 * Lesen-und-Schreiben wäre genau dieser Fehler.
 */
export async function bookLoyalty(
  tx: Prisma.TransactionClient,
  input: BookLoyaltyInput,
): Promise<{ balanceAfter: number }> {
  const type = txType.parse(input.type);
  const amount = z.number().int().parse(input.amount);

  const customer = await tx.customer.findUnique({ where: { id: input.customerId } });
  if (!customer) throw new NotFoundError("Kunde nicht gefunden.");

  if (amount < 0) {
    const taken = await tx.customer.updateMany({
      where: { id: input.customerId, loyaltyBalance: { gte: -amount } },
      data: { loyaltyBalance: { decrement: -amount } },
    });

    if (taken.count === 0) throw new InsufficientLoyaltyError();
  } else {
    await tx.customer.update({
      where: { id: input.customerId },
      data: { loyaltyBalance: { increment: amount } },
    });
  }

  const stored = await tx.customer.findUniqueOrThrow({ where: { id: input.customerId } });

  if (input.visitAt) {
    await tx.customer.update({ where: { id: input.customerId }, data: { lastVisitAt: input.visitAt } });
  }

  await tx.loyaltyTransaction.create({
    data: {
      customerId: input.customerId,
      type,
      amount,
      balanceAfter: stored.loyaltyBalance,
      orderId: input.orderId ?? null,
      invoiceId: input.invoiceId ?? null,
      rewardId: input.rewardId ?? null,
      employeeId: input.employeeId,
      note: input.note ?? null,
    },
  });

  return { balanceAfter: stored.loyaltyBalance };
}
