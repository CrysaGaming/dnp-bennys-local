"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Start-Passwort (Spec 3.5): es wird nur einmal angezeigt, danach ist es nirgends mehr
 * zu lesen. Darum der Hinweis und das Kopieren als einziger Weg, es weiterzugeben.
 */
export function StartPasswordDialog({
  password,
  onClose,
}: {
  password: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Start-Passwort</AlertDialogTitle>
          <AlertDialogDescription>
            <p data-testid="start-password" className="font-mono text-foreground">
              {password}
            </p>
            <p className="mt-2">Wird nur jetzt angezeigt.</p>
            {copied ? <p className="mt-2 text-xs text-muted-foreground">Kopiert.</p> : null}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              navigator.clipboard?.writeText(password);
              setCopied(true);
            }}
          >
            <Copy aria-hidden className="size-4" />
            Kopieren
          </Button>
          <Button type="button" onClick={onClose}>
            Fertig
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
