"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { startRouteAction } from "@/features/auth/actions";
import { loginSchema } from "@/features/auth/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Login-Formular. `onResult` ist der Haken für die GTA-Animationen in Phase 3.
 * Fehler laufen über `aria-live`, damit Screenreader sie Ansagen.
 */
export function LoginForm({ onResult }: { onResult?: (r: "success" | "error") => void }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = loginSchema.safeParse({ username, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Bitte Eingaben prüfen.");
      onResult?.("error");
      return;
    }

    setBusy(true);
    const { error: authError } = await authClient.signIn.username({
      username: parsed.data.username,
      password: parsed.data.password,
    });

    if (authError) {
      setError(
        authError.code === "BANNED_USER"
          ? "Dein Zugang ist gesperrt."
          : "Benutzername oder Passwort falsch.",
      );
      setBusy(false);
      onResult?.("error");
      return;
    }

    onResult?.("success");
    // Die Startroute nennt der Server: bei gesetztem Flag führt sie direkt zur
    // Passwortseite, sonst ins Dashboard.
    router.replace(await startRouteAction());
  }

  return (
    <form className="flex flex-col gap-4" noValidate onSubmit={submit}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="username">Benutzername</Label>
        <Input id="username" name="username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Passwort</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <p className="text-sm text-destructive" role="alert" aria-live="polite">
        {error}
      </p>

      <Button type="submit" disabled={busy}>
        Einloggen
      </Button>
    </form>
  );
}
