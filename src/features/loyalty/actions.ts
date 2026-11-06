"use server";

import { runAction, type ActionResult } from "@/lib/action";
import type { AdjustInput, LoyaltySettingsInput, RewardInput } from "./schemas";
import {
  adjustLoyalty,
  createReward,
  getLoyaltySettings,
  listRewards,
  setRewardActive,
  updateLoyaltySettings,
  updateReward,
} from "./service";

// Läuft nur durch, wenn die Tupel veränderlich sind – mit as const wäre es readonly.
const REVALIDATE: Array<[string, "page"]> = [
  ["/kunden", "page"],
  ["/kunden/praemien", "page"],
  ["/kunden/treue-einstellungen", "page"],
];

export async function loyaltySettingsAction(): Promise<ActionResult<unknown>> {
  return runAction(() => getLoyaltySettings(), { revalidate: REVALIDATE });
}

export async function saveLoyaltySettingsAction(input: LoyaltySettingsInput): Promise<ActionResult<unknown>> {
  return runAction((ctx) => updateLoyaltySettings(ctx, input), { revalidate: REVALIDATE });
}

export async function listRewardsAction(opts: { includeInactive?: boolean } = {}): Promise<ActionResult<unknown>> {
  return runAction((ctx) => listRewards(ctx, opts), { revalidate: REVALIDATE });
}

export async function saveRewardAction(input: RewardInput): Promise<ActionResult<unknown>> {
  return runAction((ctx) => createReward(ctx, input), { revalidate: REVALIDATE });
}

export async function updateRewardAction(id: string, input: RewardInput): Promise<ActionResult<unknown>> {
  return runAction((ctx) => updateReward(ctx, id, input), { revalidate: REVALIDATE });
}

export async function setRewardActiveAction(id: string, active: boolean): Promise<ActionResult<unknown>> {
  return runAction((ctx) => setRewardActive(ctx, id, active), { revalidate: REVALIDATE });
}

export async function adjustLoyaltyAction(input: AdjustInput): Promise<ActionResult<unknown>> {
  return runAction((ctx) => adjustLoyalty(ctx, input), { revalidate: [["/kunden", "page"]] });
}
