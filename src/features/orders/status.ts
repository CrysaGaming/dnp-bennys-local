import type { OrderStatus } from "@/generated/prisma/enums";
import type { SessionContext } from "@/lib/session-types";
import { hasPermission } from "@/lib/permissions";

/** Statusübergänge als reine Tabelle (Spec 5.6). Nichts anderes ist erlaubt. */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  OPEN: ["IN_PROGRESS", "DONE", "CANCELLED"],
  IN_PROGRESS: ["DONE", "CANCELLED"],
  DONE: ["CANCELLED"],
  CANCELLED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/**
 * Fremde Aufträge nur mit ORDERS_MANAGE, den eigenen oder den zugewiesenen auch ohne
 * (Spec 5.6 und 5.9).
 */
export function canEditOrder(
  ctx: Pick<SessionContext, "isAdmin" | "permissions" | "employeeId">,
  order: { createdById: string; assignedToId: string | null },
): boolean {
  if (hasPermission(ctx, "ORDERS_MANAGE")) return true;
  return order.createdById === ctx.employeeId || order.assignedToId === ctx.employeeId;
}
