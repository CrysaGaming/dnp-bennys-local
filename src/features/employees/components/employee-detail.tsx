"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmployeeForm } from "./employee-form";
import { resetEmployeePasswordAction, terminateEmployeeAction } from "../actions";
import { StartPasswordDialog } from "./start-password-dialog";
import type { EmployeeRow } from "../service";
import type { RankChoice } from "./employee-form";

/** Detailseite (Spec 5.6): Bearbeiten, Sperren mit Grund, Passwort zurücksetzen. */
export function EmployeeDetail({
  employee,
  ranks,
  canTerminate,
}: {
  employee: EmployeeRow;
  ranks: RankChoice[];
  canTerminate: boolean;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [password, setPassword] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function terminate() {
    setBusy(true);
    const res = await terminateEmployeeAction(employee.id, reason.trim() || null);
    setBusy(false);

    if (!res.ok) {
      toast(res.error);
      return;
    }

    toast("Mitarbeiter gesperrt.");
    router.refresh();
  }

  async function reset() {
    setBusy(true);
    const res = await resetEmployeePasswordAction(employee.id);
    setBusy(false);

    if (!res.ok) {
      toast(res.error);
      return;
    }

    setPassword(res.data?.startPassword ?? null);
  }

  return (
    <div className="flex flex-col gap-6">
      <EmployeeForm employee={employee} ranks={ranks} />

      {canTerminate ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="reason">Grund für die Sperre</Label>
          <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />

          <div className="flex gap-2">
            <Button type="button" variant="destructive" disabled={busy} onClick={terminate}>
              Sperren
            </Button>
            <Button type="button" variant="outline" disabled={busy} onClick={reset}>
              Passwort zurücksetzen
            </Button>
          </div>
        </div>
      ) : null}

      {password ? <StartPasswordDialog password={password} onClose={() => setPassword(null)} /> : null}
    </div>
  );
}
