import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { assertPermission } from "@/lib/permissions";
import { BusinessRuleError, ConflictError, NotFoundError } from "@/lib/errors";
import type { SessionContext } from "@/lib/session-types";
import type { InvoiceStatus, PaymentMethod } from "@/generated/prisma/enums";
import { calcEarn } from "@/features/loyalty/earn";
import { bookLoyalty } from "@/features/loyalty/ledger";

const methodSchema = z.enum(["CASH", "BANK"]);
const reasonSchema = z.string().trim().min(3).max(200);

const ONLY_DONE = "Rechnungen gibt es nur für abgeschlossene Aufträge.";
const ALREADY = "Für diesen Auftrag gibt es schon eine Rechnung.";
const PAID = "Rechnung ist schon bezahlt.";
const VOIDED = "Die Rechnung ist schon storniert.";

export async function createInvoice(
  ctx: SessionContext,
  orderId: string,
): Promise<{ id: string; number: number }> {
  assertPermission(ctx, "INVOICES_MANAGE");

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundError("Auftrag nicht gefunden.");
    if (order.status !== "DONE") throw new BusinessRuleError(ONLY_DONE);

    // Auch eine VOID-Rechnung lässt keine neue zu – der Auftrag muss neu angelegt werden (Spec 7.4).
    const existing = await tx.invoice.findUnique({ where: { orderId } });
    if (existing) throw new ConflictError("orderId", ALREADY);

    const invoice = await tx.invoice.create({
      data: { orderId, amount: order.total, issuedById: ctx.employeeId },
    });

    await writeAudit(tx, {
      actorId: ctx.userId,
      action: "invoice.create",
      entity: "invoice",
      entityId: invoice.id,
      data: { number: invoice.number, amount: invoice.amount },
    });

    return { id: invoice.id, number: invoice.number };
  });
}

/**
 * Bezahlen und Gutschrift in einer Transaktion. Der Zahlungsschalter ist ein bedingtes Update –
 * nur der erste Aufruf kommt durch, sonst würde dieselbe Rechnung zweimal gutgeschrieben.
 */
export async function markInvoicePaid(
  ctx: SessionContext,
  invoiceId: string,
  method: PaymentMethod,
): Promise<{ earned: number }> {
  assertPermission(ctx, "INVOICES_MANAGE");
  const payment = methodSchema.parse(method);

  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundError("Rechnung nicht gefunden.");
    if (invoice.status === "VOID") throw new BusinessRuleError(VOIDED);

    const now = new Date();

    const marked = await tx.invoice.updateMany({
      where: { id: invoice.id, status: "OPEN" },
      data: { status: "PAID", paidAt: now, paymentMethod: payment },
    });

    if (marked.count === 0) throw new BusinessRuleError(PAID);

    const order = await tx.order.findUniqueOrThrow({ where: { id: invoice.orderId } });
    const customer = await tx.customer.findUniqueOrThrow({ where: { id: order.customerId } });
    const settings = await tx.loyaltySettings.findUnique({ where: { id: 1 } });

    const earned = settings ? calcEarn(settings, invoice.amount, customer.lastVisitAt, now) : 0;

    if (earned > 0) {
      await bookLoyalty(tx, {
        customerId: customer.id,
        type: "EARN",
        amount: earned,
        employeeId: ctx.employeeId,
        invoiceId: invoice.id,
        visitAt: now,
      });
    }

    await writeAudit(tx, {
      actorId: ctx.userId,
      action: "invoice.pay",
      entity: "invoice",
      entityId: invoice.id,
      data: { number: invoice.number, method: payment, earned },
    });

    return { earned };
  });
}

/**
 * Storno einer Rechnung. Die Gutschrift wird nur zurückgezogen, soweit das Konto noch deckt –
 * ein Konto wird nie negativ (Spec 3.6), und ohne Buchung bleibt es bei 0.
 */
export async function voidInvoice(ctx: SessionContext, invoiceId: string, reason: string): Promise<void> {
  assertPermission(ctx, "INVOICES_MANAGE");
  const note = reasonSchema.parse(reason);

  await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundError("Rechnung nicht gefunden.");
    if (invoice.status === "VOID") throw new BusinessRuleError(VOIDED);

    await tx.invoice.update({ where: { id: invoice.id }, data: { status: "VOID" } });

    const earn = await tx.loyaltyTransaction.findFirst({
      where: { invoiceId: invoice.id, type: "EARN" },
    });

    if (earn) {
      const order = await tx.order.findUniqueOrThrow({ where: { id: invoice.orderId } });
      const customer = await tx.customer.findUniqueOrThrow({ where: { id: order.customerId } });
      const deduct = Math.min(earn.amount, customer.loyaltyBalance);

      if (deduct > 0) {
        await bookLoyalty(tx, {
          customerId: customer.id,
          type: "REVERSAL",
          amount: -deduct,
          employeeId: ctx.employeeId,
          invoiceId: invoice.id,
          note,
        });
      }
    }

    await writeAudit(tx, {
      actorId: ctx.userId,
      action: "invoice.void",
      entity: "invoice",
      entityId: invoice.id,
      data: { number: invoice.number, reason: note },
    });
  });
}

export async function listInvoices(ctx: SessionContext, filter: { status?: InvoiceStatus } = {}) {
  assertPermission(ctx, "INVOICES_MANAGE");

  return prisma.invoice.findMany({
    where: { status: filter.status },
    orderBy: { issuedAt: "desc" },
    take: 100,
    include: { order: { include: { customer: true, vehicle: true } } },
  });
}
