"use server";

import { runAction, type ActionResult } from "@/lib/action";
import type { OrderItemInput } from "./schemas";
import {
  addOrderItem,
  applyReward,
  assignOrder,
  changeOrderStatus,
  createOrder,
  removeOrderItem,
  removeReward,
  setDiscount,
  setOrderItemQuantity,
} from "./service";
import type { OrderStatus } from "@/generated/prisma/enums";

// "layout" trifft auch die Detailseite – die Nummer ist hier nicht bekannt.
const REVALIDATE: Array<[string, "layout"]> = [["/auftraege", "layout"]];

export async function createOrderAction(input: unknown): Promise<ActionResult<{ id: string; number: number }>> {
  return runAction((ctx) => createOrder(ctx, input), { revalidate: REVALIDATE });
}

export async function addOrderItemAction(orderId: string, input: OrderItemInput): Promise<ActionResult<unknown>> {
  return runAction((ctx) => addOrderItem(ctx, orderId, input), { revalidate: REVALIDATE });
}

export async function setOrderItemQuantityAction(itemId: string, quantity: number): Promise<ActionResult<unknown>> {
  return runAction((ctx) => setOrderItemQuantity(ctx, itemId, quantity), { revalidate: REVALIDATE });
}

export async function removeOrderItemAction(itemId: string): Promise<ActionResult<unknown>> {
  return runAction((ctx) => removeOrderItem(ctx, itemId), { revalidate: REVALIDATE });
}

export async function setDiscountAction(orderId: string, percent: number): Promise<ActionResult<number>> {
  return runAction((ctx) => setDiscount(ctx, orderId, percent), { revalidate: REVALIDATE });
}

export async function assignOrderAction(orderId: string, employeeId: string | null): Promise<ActionResult<unknown>> {
  return runAction((ctx) => assignOrder(ctx, orderId, employeeId), { revalidate: REVALIDATE });
}

export async function changeOrderStatusAction(orderId: string, to: OrderStatus): Promise<ActionResult<unknown>> {
  return runAction((ctx) => changeOrderStatus(ctx, orderId, to), { revalidate: REVALIDATE });
}

export async function applyRewardAction(orderId: string, rewardId: string): Promise<ActionResult<unknown>> {
  return runAction((ctx) => applyReward(ctx, orderId, rewardId), { revalidate: REVALIDATE });
}

export async function removeRewardAction(orderId: string): Promise<ActionResult<unknown>> {
  return runAction((ctx) => removeReward(ctx, orderId), { revalidate: REVALIDATE });
}
