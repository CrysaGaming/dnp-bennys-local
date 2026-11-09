"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CustomerEditDialog } from "./customer-edit-dialog";
import { formatDateTime } from "@/lib/format";
import { formatCustomerNumber } from "../normalize";
import { nextReward } from "@/features/loyalty/card";
import { StampCard } from "@/features/loyalty/components/stamp-card";
import { PointsBar } from "@/features/loyalty/components/points-bar";
import { AdjustDialog } from "@/features/loyalty/components/adjust-dialog";
import type { CustomerDetail } from "../service";

export type RewardRow = { id: string; name: string; cost: number; active: boolean };

/**
 * Kundenkarte (Spec 5.7). Das Einlösen passiert im Auftrag – die Links führen dahin,
 * auch wenn der Auftrag erst in Phase 9 gebaut wird.
 */
export function CustomerCard({
  customer,
  mode,
  cardSize,
  rewards,
  canManage,
  canEdit,
}: {
  customer: CustomerDetail;
  mode: "STAMPS" | "POINTS";
  cardSize: number;
  rewards: RewardRow[];
  canManage: boolean;
  canEdit: boolean;
}) {
  const [adjustOpen, setAdjustOpen] = useState(false);
  const next = nextReward(rewards, customer.loyaltyBalance);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-mono text-lg">Kunde {formatCustomerNumber(customer.number)}</h2>

        <div className="flex items-center gap-2">
          {canEdit ? <CustomerEditDialog customer={customer} /> : null}

          <Button variant="outline" render={<Link href={`/auftraege/neu?kunde=${customer.number}`} />}>
            Neuer Auftrag
          </Button>
        </div>
      </div>

      <p className="text-sm mb-2">
        {customer.name} · Tel {customer.phone ?? "keine Rufnummer"}
      </p>

      <p className="text-sm mb-4">
        Fahrzeuge:{" "}
        {customer.vehicles.length === 0 ? (
          <span className="text-muted-foreground">keins</span>
        ) : (
          <span className="flex flex-wrap gap-2">
            {customer.vehicles.map((v) => (
              <span key={v.id} className="rounded-md border border-border px-2 py-0.5 font-mono text-xs">
                {v.plate} · {v.model}
              </span>
            ))}
          </span>
        )}
      </p>

      {mode === "STAMPS" ? (
        <StampCard
          balance={customer.loyaltyBalance}
          cardSize={cardSize}
          nextReward={next}
          customerId={customer.id}
        />
      ) : (
        <PointsBar balance={customer.loyaltyBalance} nextReward={next} />
      )}

      <p className="text-sm text-muted-foreground mb-4">
        Letzter Besuch: {customer.lastVisitAt ? formatDateTime(customer.lastVisitAt) : "kein Besuch gespeichert"}
      </p>

      {rewards.length > 0 ? (
        <section className="mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] mb-2">Prämien</h3>

          <ul className="flex flex-col gap-2">
            {rewards.map((reward) => {
              const redeemable = reward.cost <= customer.loyaltyBalance;

              return (
                <li key={reward.id} className="flex items-center justify-between gap-3 text-sm">
                  <span>
                    {reward.name} · {reward.cost}
                  </span>
                  {redeemable ? (
                    <Button
                      variant="outline"
                      size="sm"
                      render={<Link href={`/auftraege/neu?kunde=${customer.number}&praemie=${reward.id}`} />}
                    >
                      Einlösen
                    </Button>
                  ) : (
                    <span className="text-muted-foreground">noch {reward.cost - customer.loyaltyBalance}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {canManage ? (
        <>
          <Button variant="outline" onClick={() => setAdjustOpen(true)}>
            Treue buchen
          </Button>

          <AdjustDialog customerId={customer.id} open={adjustOpen} onClose={() => setAdjustOpen(false)} />
        </>
      ) : null}
    </>
  );
}
