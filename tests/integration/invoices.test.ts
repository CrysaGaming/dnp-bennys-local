import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createInvoice, listInvoices, markInvoicePaid, voidInvoice } from "@/features/invoices/service";
import { addOrderItem, changeOrderStatus, createOrder } from "@/features/orders/service";
import { ForbiddenError } from "@/lib/errors";
import { createCustomer, createPriceCategory, createPriceItem, makeCtx } from "@tests/helpers/factories";
import type { Permission } from "@/generated/prisma/enums";
import type { LoyaltySettingsInput } from "@/features/loyalty/schemas";
import type { SessionContext } from "@/lib/session-types";

const RIGHTS: Permission[] = ["INVOICES_MANAGE", "ORDERS_VIEW", "ORDERS_CREATE", "ORDERS_MANAGE", "CUSTOMERS_VIEW"];

function settings(input: Partial<LoyaltySettingsInput> & { enabled: boolean }) {
  return {
    create: { id: 1, ...input },
    update: input,
  };
}

async function setup(input: Partial<LoyaltySettingsInput> & { enabled: boolean }) {
  const ctx = await makeCtx({ permissions: RIGHTS });
  const customer = await createCustomer();
  const category = await createPriceCategory();

  await prisma.loyaltySettings.upsert({ where: { id: 1 }, ...settings(input) });

  return { ctx, customer, category };
}

async function doneOrder(ctx: SessionContext, customerId: string, categoryId: string, price: number) {
  const item = await createPriceItem({ categoryId, name: `Rechnungstest ${price} ${Math.random()}`, price });
  const order = await createOrder(ctx, { type: "REPAIR", customerId, vehicleId: null, notes: null });
  await addOrderItem(ctx, order.id, { priceListItemId: item.id, quantity: 1 });
  await changeOrderStatus(ctx, order.id, "DONE");

  return order;
}

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Rechnungen", () => {
  it("Rechnungen gibt es nur für abgeschlossene Aufträge, und pro Auftrag nur eine", async () => {
    const { ctx, customer, category } = await setup({ enabled: true, minVisitTotal: 500 });
    const item = await createPriceItem({ categoryId: category.id, name: "Offener Auftrag Test", price: 700 });
    const order = await createOrder(ctx, { type: "REPAIR", customerId: customer.id, vehicleId: null, notes: null });

    await addOrderItem(ctx, order.id, { priceListItemId: item.id, quantity: 1 });
    await expect(createInvoice(ctx, order.id)).rejects.toThrow(
      "Rechnungen gibt es nur für abgeschlossene Aufträge.",
    );

    await changeOrderStatus(ctx, order.id, "DONE");

    const invoice = await createInvoice(ctx, order.id);
    expect((await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } })).amount).toBe(700);

    await expect(createInvoice(ctx, order.id)).rejects.toThrow(
      "Für diesen Auftrag gibt es schon eine Rechnung.",
    );
  });

  it("bezahlen schreibt genau eine Gutschrift und den Besuch", async () => {
    const { ctx, customer, category } = await setup({
      enabled: true,
      mode: "STAMPS",
      stampsPerVisit: 1,
      minVisitTotal: 500,
      cooldownHours: 12,
    });

    const order = await doneOrder(ctx, customer.id, category.id, 1200);
    const invoice = await createInvoice(ctx, order.id);

    expect(await markInvoicePaid(ctx, invoice.id, "CASH")).toEqual({ earned: 1 });

    const stored = await prisma.customer.findUniqueOrThrow({ where: { id: customer.id } });
    expect(stored.loyaltyBalance).toBe(1);
    expect(stored.lastVisitAt).not.toBeNull();
    expect(await prisma.loyaltyTransaction.count({ where: { invoiceId: invoice.id, type: "EARN" } })).toBe(1);
  });

  it("unter dem Mindestbetrag gibt es nichts", async () => {
    const { ctx, customer, category } = await setup({ enabled: true, minVisitTotal: 500 });
    const order = await doneOrder(ctx, customer.id, category.id, 400);
    const invoice = await createInvoice(ctx, order.id);

    expect((await markInvoicePaid(ctx, invoice.id, "BANK")).earned).toBe(0);
    expect(await prisma.loyaltyTransaction.count({ where: { invoiceId: invoice.id } })).toBe(0);
    expect((await prisma.customer.findUniqueOrThrow({ where: { id: customer.id } })).loyaltyBalance).toBe(0);
  });

  it("Sperrzeit: die zweite bezahlte Rechnung eine Stunde später bringt nichts", async () => {
    const { ctx, customer, category } = await setup({ enabled: true, minVisitTotal: 500, cooldownHours: 12 });

    const first = await doneOrder(ctx, customer.id, category.id, 1200);
    const firstInvoice = await createInvoice(ctx, first.id);
    await markInvoicePaid(ctx, firstInvoice.id, "CASH");

    await prisma.customer.update({
      where: { id: customer.id },
      data: { lastVisitAt: new Date(Date.now() - 3_600_000) },
    });

    const second = await doneOrder(ctx, customer.id, category.id, 1200);
    const secondInvoice = await createInvoice(ctx, second.id);

    expect((await markInvoicePaid(ctx, secondInvoice.id, "CASH")).earned).toBe(0);
    expect((await prisma.customer.findUniqueOrThrow({ where: { id: customer.id } })).loyaltyBalance).toBe(1);
  });

  it("Punkte-Modus rechnet nach dem Umrechner", async () => {
    const { ctx, customer, category } = await setup({
      enabled: true,
      mode: "POINTS",
      dollarsPerPoint: 100,
      minVisitTotal: 500,
    });

    const order = await doneOrder(ctx, customer.id, category.id, 1200);
    const invoice = await createInvoice(ctx, order.id);

    expect((await markInvoicePaid(ctx, invoice.id, "CASH")).earned).toBe(12);
  });

  it("zweimal bezahlen geht nicht", async () => {
    const { ctx, customer, category } = await setup({ enabled: true, minVisitTotal: 500, cooldownHours: 0 });

    const order = await doneOrder(ctx, customer.id, category.id, 1200);
    const invoice = await createInvoice(ctx, order.id);

    expect((await markInvoicePaid(ctx, invoice.id, "CASH")).earned).toBe(1);
    await expect(markInvoicePaid(ctx, invoice.id, "CASH")).rejects.toThrow("Rechnung ist schon bezahlt.");
    expect(await prisma.loyaltyTransaction.count({ where: { invoiceId: invoice.id, type: "EARN" } })).toBe(1);
    expect((await prisma.customer.findUniqueOrThrow({ where: { id: customer.id } })).loyaltyBalance).toBe(1);
  });

  it("parallel bezahlen – genau eine Gutschrift", async () => {
    // Ohne Sperrzeit zählt hier nur der Doppelzahlungsschutz – die Sperrzeit hat ihren eigenen Test.
    const { ctx, customer, category } = await setup({ enabled: true, minVisitTotal: 500, cooldownHours: 0 });

    const order = await doneOrder(ctx, customer.id, category.id, 1200);
    const invoice = await createInvoice(ctx, order.id);

    const results = await Promise.allSettled([
      markInvoicePaid(ctx, invoice.id, "CASH"),
      markInvoicePaid(ctx, invoice.id, "BANK"),
    ]);

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await prisma.loyaltyTransaction.count({ where: { invoiceId: invoice.id, type: "EARN" } })).toBe(1);
    expect((await prisma.customer.findUniqueOrThrow({ where: { id: customer.id } })).loyaltyBalance).toBe(1);
  });

  it("VOID einer bezahlten Rechnung zieht die Gutschrift ab", async () => {
    const { ctx, customer, category } = await setup({ enabled: true, minVisitTotal: 500 });

    const order = await doneOrder(ctx, customer.id, category.id, 1200);
    const invoice = await createInvoice(ctx, order.id);
    await markInvoicePaid(ctx, invoice.id, "CASH");

    await voidInvoice(ctx, invoice.id, "Falsch berechnet");

    expect((await prisma.customer.findUniqueOrThrow({ where: { id: customer.id } })).loyaltyBalance).toBe(0);
    const reversal = await prisma.loyaltyTransaction.findFirstOrThrow({
      where: { invoiceId: invoice.id, type: "REVERSAL" },
    });
    expect(reversal.amount).toBe(-1);
    expect(reversal.note).toBe("Falsch berechnet");
  });

  it("Review Focus: ist das Guthaben schon ausgegeben, bleibt es bei 0 und es gibt keine Buchung", async () => {
    const { ctx, customer, category } = await setup({ enabled: true, minVisitTotal: 500 });

    const order = await doneOrder(ctx, customer.id, category.id, 1200);
    const invoice = await createInvoice(ctx, order.id);
    await markInvoicePaid(ctx, invoice.id, "CASH");

    // Der Kunde hat den Stempel woanders ausgegeben, das Konto ist wieder leer.
    await prisma.customer.update({ where: { id: customer.id }, data: { loyaltyBalance: 0 } });

    await voidInvoice(ctx, invoice.id, "Kunde hat schon eingelöst");

    expect((await prisma.customer.findUniqueOrThrow({ where: { id: customer.id } })).loyaltyBalance).toBe(0);
    expect(await prisma.loyaltyTransaction.count({ where: { invoiceId: invoice.id, type: "REVERSAL" } })).toBe(0);
    expect(await prisma.loyaltyTransaction.count({ where: { invoiceId: invoice.id } })).toBe(1);
  });

  it("ohne INVOICES_MANAGE wird nichts geschrieben und nichts gelistet", async () => {
    const { ctx, customer, category } = await setup({ enabled: true, minVisitTotal: 500 });
    const order = await doneOrder(ctx, customer.id, category.id, 900);

    const noRight = await makeCtx({ permissions: ["ORDERS_VIEW"] });
    await expect(createInvoice(noRight, order.id)).rejects.toThrow(ForbiddenError);
    await expect(listInvoices(noRight, {})).rejects.toThrow(ForbiddenError);

    const invoice = await createInvoice(ctx, order.id);
    expect((await listInvoices(ctx, { status: "OPEN" })).map((i) => i.id)).toContain(invoice.id);
    expect((await listInvoices(ctx, { status: "PAID" })).map((i) => i.id)).not.toContain(invoice.id);
  });
});
