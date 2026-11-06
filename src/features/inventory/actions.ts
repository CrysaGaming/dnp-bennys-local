"use server";

import { runAction, type ActionResult } from "@/lib/action";
import type { BookingInput, PartInput } from "./schemas";
import type { MovementRow } from "./movement-types";
import { bookMovement, createPart, listMovements, updatePart } from "./service";

export async function savePart(input: PartInput): Promise<ActionResult<unknown>> {
  return runAction((ctx) => createPart(ctx, input), { revalidate: [["/lager", "page"]] });
}

export async function editPart(id: string, input: PartInput): Promise<ActionResult<unknown>> {
  return runAction((ctx) => updatePart(ctx, id, input), { revalidate: [["/lager", "page"]] });
}

export async function book(input: BookingInput): Promise<ActionResult<unknown>> {
  return runAction((ctx) => bookMovement(ctx, input), { revalidate: [["/lager", "page"]] });
}

export async function listMovementsAction(partId: string): Promise<ActionResult<MovementRow[]>> {
  return runAction((ctx) => listMovements(ctx, partId), { revalidate: [["/lager", "page"]] });
}
