"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { completePasswordChangeAction } from "@/features/account/actions";
import { passwordChangeSchema } from "@/features/auth/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Besser Auth ändert das Passwort, die Action erledigt danach das Zwangs-Flag
 * und das Audit (Spec 3.2 / 4.4).
 */
export function ChangePasswordForm() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = passwordChangeSchema.safeParse({ currentPassword, newPassword, confirmPassword });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Bitte Eingaben prüfen.");
      return;
    }

    setBusy(true);

    const { error: authError } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });

    if (authError) {
      setError("Passwortwechsel fehlgeschlagen. Bitte erneut versuchen.");
      setBusy(false);
      return;
    }

    const res = await completePasswordChangeAction({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!res.ok) {
      setError(res.error);
      setBusy(false);
      return;
    }

    router.replace("/dashboard");
  }

  return (
    <form className="flex flex-col gap-4" noValidate onSubmit={submit}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="currentPassword">Aktuelles Passwort</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="newPassword">Neues Passwort</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmPassword">Neues Passwort bestätigen</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      <p className="text-sm text-destructive" role="alert" aria-live="polite">
        {error}
      </p>

      <Button type="submit" disabled={busy}>
        Passwort ändern
      </Button>
    </form>
  );
}
