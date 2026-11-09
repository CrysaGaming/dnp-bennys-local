"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/lib/format";
import { RewardDialog } from "./reward-dialog";
import { listRewardsAction, setRewardActiveAction } from "../actions";
import type { RewardRow } from "../reward-types";

function valueLabel(row: RewardRow): string {
  if (row.type === "PERCENT_DISCOUNT") return `${row.value} %`;
  if (row.type === "FIXED_DISCOUNT") return formatMoney(row.value);
  return "Leistung";
}

/** Prämienliste (Spec 5.10): Tabelle plus Schalter für inaktive Prämien. */
export function RewardTable({
  rewards,
  items,
  canManage,
}: {
  rewards: RewardRow[];
  items: Array<{ id: string; name: string }>;
  canManage: boolean;
}) {
  const [rows, setRows] = useState(rewards);
  const [showInactive, setShowInactive] = useState(false);

  async function refresh(show: boolean) {
    const res = await listRewardsAction({ includeInactive: show });
    if (res.ok) setRows(res.data as RewardRow[]);
  }

  async function toggle(id: string, active: boolean) {
    const res = await setRewardActiveAction(id, active);
    if (!res.ok) return;
    await refresh(showInactive);
  }

  return (
    <>
      {canManage ? <RewardDialog items={items} onSaved={() => void refresh(showInactive)} /> : null}

      {canManage ? (
        <div className="flex items-center gap-2 mb-4">
          <Checkbox
            id="show-inactive-rewards"
            checked={showInactive}
            onCheckedChange={(checked) => {
              const on = checked === true;
              setShowInactive(on);
              void refresh(on);
            }}
          />
          <Label htmlFor="show-inactive-rewards">Inaktive zeigen</Label>
        </div>
      ) : null}

      {rows.length === 0 ? <p className="text-sm text-muted-foreground">Noch keine Prämien.</p> : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Art</TableHead>
            <TableHead>Wert</TableHead>
            <TableHead>Kosten</TableHead>
            <TableHead>Leistung</TableHead>
            <TableHead>Status</TableHead>
            {canManage ? <TableHead>Aktion</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((reward) => (
            <TableRow key={reward.id}>
              <TableCell>{reward.name}</TableCell>
              <TableCell>{valueLabel(reward)}</TableCell>
              <TableCell>{reward.value}</TableCell>
              <TableCell>{reward.cost}</TableCell>
              <TableCell>{reward.itemName ?? "–"}</TableCell>
              <TableCell>{reward.active ? <span>–</span> : <Badge variant="secondary">inaktiv</Badge>}</TableCell>
              {canManage ? (
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => void toggle(reward.id, !reward.active)}>
                    {reward.active ? "Deaktivieren" : "Aktivieren"}
                  </Button>
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
