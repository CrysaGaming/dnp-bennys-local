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
import { StartPasswordDialog } from "./start-password-dialog";
import { resetEmployeePasswordAction, terminateEmployeeAction } from "../actions";
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
  const [lockOpen, setLockOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [password, setPassword] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function lock() {
    setBusy(true);
    const res = await terminateEmployeeAction(employee.id, reason.trim() || null);
    setBusy(false);

    if (!res.ok) {
      toast(res.error);
      return;
    }

    toast("Mitarbeiter gesperrt.");
    setLockOpen(false);
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
        <div className="flex gap-2">
          <Button type="button" variant="destructive" onClick={() => setLockOpen(true)}>
            Sperren
          </Button>
          <Button type="button" variant="outline" disabled={busy} onClick={reset}>
            Passwort zurücksetzen
          </Button>
        </div>
      ) : null}

      {lockOpen ? (
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{employee.name} sperren?</AlertDialogTitle>
              <AlertDialogDescription>
                Der Zugang wird gesperrt und alle Sessions gelöscht. Der Mitarbeiter bleibt
                in der Liste.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="lock-reason">Grund (optional)</Label>
                <Textarea
                  id="lock-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={500}
                />
              </div>

              <div className="flex gap-2">
                <AlertDialogCancel type="button">Abbrechen</AlertDialogCancel>
                <Button type="button" variant="destructive" disabled={busy} onClick={lock}>
                  Sperren
                </Button>
              </div>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}

      {password ? <StartPasswordDialog password={password} onClose={() => setPassword(null)} /> : null}
    </div>
  );
}
