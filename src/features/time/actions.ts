"use server";

import { runAction, type ActionResult } from "@/lib/action";
import { clockIn, clockOut, correctEntry, getOpenEntry, listEntries } from "./service";
import type { TimeEntry } from "@/generated/prisma/client";

/** Revalidate auf das Layout, weil die Stempelkarte in der Sidebar steht (Spec 5.7). */
export async function clockInAction(): Promise<ActionResult<TimeEntry>> {
  return runAction((ctx) => clockIn(ctx), { revalidate: [["/", "layout"]] });
}

export async function clockOutAction(): Promise<ActionResult<TimeEntry>> {
  return runAction((ctx) => clockOut(ctx), { revalidate: [["/", "layout"]] });
}

export async function openEntryAction(): Promise<ActionResult<TimeEntry | null>> {
  return runAction((ctx) => getOpenEntry(ctx), { revalidate: [["/", "layout"]] });
}

export async function correctEntryAction(
  id: string,
  input: { clockIn: Date; clockOut: Date | null; note: string },
): Promise<ActionResult<void>> {
  return runAction((ctx) => correctEntry(ctx, id, input), {
    revalidate: [["/", "layout"], ["/dienstzeiten", "page"], ["/mitarbeiter", "page"]],
  });
}

export async function listEntriesAction(q: {
  employeeId?: string;
  weekStart: Date;
}): Promise<ActionResult<TimeEntry[]>> {
  return runAction((ctx) => listEntries(ctx, q), { revalidate: [["/dienstzeiten", "page"]] });
}
