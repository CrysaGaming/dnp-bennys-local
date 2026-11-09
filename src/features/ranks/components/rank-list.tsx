"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Lock, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";
import { RankDialog } from "./rank-dialog";
import { deleteRankAction } from "../actions";
import type { RankRow } from "../service";
import type { Permission } from "@/generated/prisma/enums";

/**
 * Ränge-Creator (Spec 5.9): Liste plus Modal. Ein Rang mit Mitarbeitern lässt sich
 * nicht löschen – der Dialog nennt die Zahl und verlinkt die gefilterte Liste.
 */
export function RankList({ ranks, grantable }: { ranks: RankRow[]; grantable: Permission[] }) {
  const [editing, setEditing] = useState<RankRow | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleting, setDeleting] = useState<RankRow | null>(null);
  const [busy, setBusy] = useState(false);

  function openNew() {
    setEditing(null);
    setEditorOpen(true);
  }

  function openEdit(rank: RankRow) {
    setEditing(rank);
    setEditorOpen(true);
  }

  async function remove(rank: RankRow) {
    setBusy(true);
    const res = await deleteRankAction(rank.id);
    setBusy(false);

    if (!res.ok) {
      toast(res.error);
      return;
    }

    toast("Rang gelöscht.");
    setDeleting(null);
  }

  return (
    <>
      <PageHeader
        title="Ränge"
        breadcrumb={[{ label: "Dashboard", href: "/dashboard" }, { label: "Ränge" }]}
        actions={
          <Button type="button" onClick={openNew}>
            Neuer Rang
          </Button>
        }
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rang</TableHead>
            <TableHead>Level</TableHead>
            <TableHead>Rechte</TableHead>
            <TableHead>Mitarbeiter</TableHead>
            <TableHead className="text-right">Aktion</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ranks.map((rank) => (
            <TableRow key={rank.id}>
              <TableCell>
                <span className="flex items-center gap-2">
                  <span aria-hidden className="size-2.5 rounded-full" style={{ background: rank.color }} />
                  {rank.name}
                </span>
              </TableCell>
              <TableCell className="font-mono tabular-nums">{rank.level}</TableCell>
              <TableCell className="font-mono tabular-nums">{rank.permissions.length} Rechte</TableCell>
              <TableCell className="font-mono tabular-nums">{rank.employeeCount} Mitarbeiter</TableCell>
              <TableCell className="text-right">
                {rank.isSystem ? (
                  <span role="img" aria-label="Geschützter System-Rang">
                    <Lock aria-hidden className="size-4" />
                  </span>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger aria-label="Aktionen">
                      <MoreHorizontal aria-hidden className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onSelect={() => openEdit(rank)}>Bearbeiten</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setDeleting(rank)}>Löschen</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editorOpen ? (
        // key erzwingt einen neuen Zustand pro Rang – sonst bleibt der vorherige im Formular.
        <RankDialog
          key={editing?.id ?? "new"}
          open
          onOpenChange={setEditorOpen}
          rank={editing}
          grantable={grantable}
        />
      ) : null}

      {deleting ? (
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Rang „{deleting.name}“ löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                {deleting.employeeCount > 0
                  ? `Diesem Rang sind noch ${deleting.employeeCount} Mitarbeiter zugeordnet. Erst müssen sie einen anderen Rang bekommen: `
                  : "Der Rang hat keine Mitarbeiter."}
                {deleting.employeeCount > 0 ? (
                  <Link href={`/mitarbeiter?rang=${deleting.id}`}>Mitarbeiter dieses Rangs</Link>
                ) : null}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-2">
              <AlertDialogCancel type="button">Abbrechen</AlertDialogCancel>
              <Button type="button" disabled={busy || deleting.employeeCount > 0} onClick={() => remove(deleting)}>
                Löschen
              </Button>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </>
  );
}
