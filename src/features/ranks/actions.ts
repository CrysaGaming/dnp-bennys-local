"use server";

import { runAction, type ActionResult } from "@/lib/action";
import { createRank, deleteRank, listRanks, updateRank, type RankRow } from "./service";

/** Dünne Actions – die Rechteprüfung passiert in den Fachfunktionen (Spec 4.4). */
export async function listRanksAction(): Promise<ActionResult<RankRow[]>> {
  return runAction((ctx) => listRanks(ctx), { revalidate: [["/raenge", "page"]] });
}

export async function createRankAction(input: unknown): Promise<ActionResult<RankRow>> {
  return runAction((ctx) => createRank(ctx, input), { revalidate: [["/raenge", "page"]] });
}

export async function updateRankAction(id: string, input: unknown): Promise<ActionResult<RankRow>> {
  return runAction((ctx) => updateRank(ctx, id, input), { revalidate: [["/raenge", "page"]] });
}

export async function deleteRankAction(id: string): Promise<ActionResult<void>> {
  return runAction((ctx) => deleteRank(ctx, id), { revalidate: [["/raenge", "page"]] });
}
