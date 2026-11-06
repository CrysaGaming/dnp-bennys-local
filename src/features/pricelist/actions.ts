"use server";

import { runAction, type ActionResult } from "@/lib/action";
import type { CategoryInput, PriceItemInput } from "./schemas";
import {
  createCategory,
  createPriceItem,
  deleteCategory,
  getPriceList,
  setPriceItemActive,
  updatePriceItem,
} from "./service";

export async function priceListAction(opts: { includeInactive?: boolean } = {}): Promise<ActionResult<unknown>> {
  return runAction((ctx) => getPriceList(ctx, opts), { revalidate: [["/preisliste", "page"]] });
}

export async function saveCategory(input: CategoryInput): Promise<ActionResult<unknown>> {
  return runAction((ctx) => createCategory(ctx, input), { revalidate: [["/preisliste", "page"]] });
}

export async function removeCategory(id: string): Promise<ActionResult<unknown>> {
  return runAction((ctx) => deleteCategory(ctx, id), { revalidate: [["/preisliste", "page"]] });
}

export async function savePriceItem(input: PriceItemInput): Promise<ActionResult<unknown>> {
  return runAction((ctx) => createPriceItem(ctx, input), { revalidate: [["/preisliste", "page"]] });
}

export async function editPriceItem(id: string, input: PriceItemInput): Promise<ActionResult<unknown>> {
  return runAction((ctx) => updatePriceItem(ctx, id, input), { revalidate: [["/preisliste", "page"]] });
}

export async function togglePriceItemActive(id: string, active: boolean): Promise<ActionResult<unknown>> {
  return runAction((ctx) => setPriceItemActive(ctx, id, active), { revalidate: [["/preisliste", "page"]] });
}
