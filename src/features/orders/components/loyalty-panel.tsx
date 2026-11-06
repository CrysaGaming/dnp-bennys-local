"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { applyRewardAction, removeRewardAction } from "../actions";

/** Treuebereich im Auftrag (Spec 3.6): Guthaben, was der Kunde sich leisten kann, einlösen. */
export function LoyaltyPanel({
  orderId,
  customerName,
  balance,
  rewards,
  appliedReward,
  canEdit,
  isOpen,
}: {
  orderId: string;
  customerName: string;
  balance: number;
  rewards: Array<{ id: string; name: string; cost: number }>;
  appliedReward: { id: string; name: string; cost: number } | null;
  canEdit: boolean;
  isOpen: boolean;
}) {
  const [busy, setBusy] = useState(false);

  async function redeem(rewardId: string) {
    setBusy(true);
    const res = await applyRewardAction(orderId, rewardId);
    setBusy(false);
    if (!res.ok) toast(res.error);
  }

  async function remove() {
    if (!appliedReward) return;

    setBusy(true);
    const res = await removeRewardAction(orderId);
    setBusy(false);
    if (!res.ok) toast(res.error);
  }

  return (
    <section className="border border-border rounded-lg p-4 mb-6">
      <h2 className="font-display text-xl uppercase mb-3">Treue</h2>

      <p className="text-sm mb-3">
        {customerName}: {balance} – {rewards.length} Prämie{rewards.length === 1 ? "" : "n"} einlösbar
      </p>

      {appliedReward ? (
        <div className="flex items-center justify-between gap-3">
          <span>
            Eingelöst: <strong>{appliedReward.name}</strong>
          </span>
          {canEdit ? (
            <Button variant="outline" size="sm" onClick={() => void remove()} disabled={busy}>
              Entfernen
            </Button>
          ) : null}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {rewards.length === 0 ? <li className="text-sm text-muted-foreground">Keine Prämie passt.</li> : null}
          {rewards.map((reward) => (
            <li key={reward.id} className="flex items-center justify-between gap-3">
              <span>
                {reward.name} – {reward.cost}
              </span>
              {canEdit && isOpen ? (
                <Button size="sm" onClick={() => void redeem(reward.id)} disabled={busy}>
                  Einlösen
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
