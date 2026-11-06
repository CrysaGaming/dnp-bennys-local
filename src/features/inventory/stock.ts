import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { InsufficientStockError } from "@/lib/errors";

export type StockMovementReason = z.infer<typeof reasonSchema>;

const reasonSchema = z.enum(["PURCHASE", "ORDER_USAGE", "CORRECTION", "LOSS"]);

export type BookStockInput = {
  partId: string;
  delta: number;
  reason: StockMovementReason;
  employeeId: string;
  orderId?: string | null;
  note?: string | null;
};

/**
 * Einziger Weg, den Bestand zu ändern (Spec 5.6).
 *
 * Die Abbuchung ist ein bedingtes Update: sie passiert nur, wenn genug da ist. Zwei
 * gleichzeitige Abbuchungen, die zusammen den Bestand übersteigen, laufen dadurch nicht
 * als beide durch – die zweite bekommt keine Zeile und scheitert. Ein Lesen-und-Schreiben
 * wäre genau dieser Fehler.
 */
export async function bookStock(
  tx: Prisma.TransactionClient,
  input: BookStockInput,
): Promise<{ stock: number }> {
  const reason = reasonSchema.parse(input.reason);
  const delta = z.number().int().parse(input.delta);

  if (delta === 0) {
    throw new InsufficientStockError("Buchung ohne Menge ist keine Buchung.");
  }

  if (delta > 0) {
    await tx.part.update({ where: { id: input.partId }, data: { stock: { increment: delta } } });
  } else {
    const taken = await tx.part.updateMany({
      where: { id: input.partId, stock: { gte: -delta } },
      data: { stock: { decrement: -delta } },
    });

    if (taken.count === 0) {
      throw new InsufficientStockError();
    }
  }

  const part = await tx.part.findUniqueOrThrow({ where: { id: input.partId } });

  await tx.stockMovement.create({
    data: {
      partId: input.partId,
      delta,
      reason,
      employeeId: input.employeeId,
      orderId: input.orderId ?? null,
      note: input.note ?? null,
    },
  });

  return { stock: part.stock };
}
