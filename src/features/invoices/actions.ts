"use server";

import { runAction, type ActionResult } from "@/lib/action";
import { createInvoice, listInvoices, markInvoicePaid, voidInvoice } from "./service";
import type { InvoiceStatus, PaymentMethod } from "@/generated/prisma/enums";

const REVALIDATE: Array<[string, "layout"]> = [["/rechnungen", "layout"], ["/auftraege", "layout"]];

export async function createInvoiceAction(orderId: string): Promise<ActionResult<{ id: string; number: number }>> {
  return runAction((ctx) => createInvoice(ctx, orderId), { revalidate: REVALIDATE });
}

export async function payInvoiceAction(
  invoiceId: string,
  method: PaymentMethod,
): Promise<ActionResult<{ earned: number }>> {
  return runAction((ctx) => markInvoicePaid(ctx, invoiceId, method), { revalidate: REVALIDATE });
}

export async function voidInvoiceAction(invoiceId: string, reason: string): Promise<ActionResult<unknown>> {
  return runAction((ctx) => voidInvoice(ctx, invoiceId, reason), { revalidate: REVALIDATE });
}

export async function listInvoicesAction(filter: { status?: InvoiceStatus } = {}): Promise<ActionResult<unknown>> {
  return runAction((ctx) => listInvoices(ctx, filter), { revalidate: REVALIDATE });
}
