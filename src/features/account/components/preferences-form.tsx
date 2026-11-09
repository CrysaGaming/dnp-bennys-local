"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { preferencesSchema, type PreferencesInput } from "../schemas";
import { updatePreferencesAction } from "../actions";

const THEME_LABELS: Record<PreferencesInput["theme"], string> = {
  SYSTEM: "System",
  LIGHT: "Hell",
  DARK: "Dunkel",
};

/** Theme und Bewegung (Spec 5.12): die Wahl kommt in die DB und wirkt sofort. */
export function PreferencesForm({
  theme,
  reducedMotion,
}: {
  theme: PreferencesInput["theme"];
  reducedMotion: boolean;
}) {
  const { setTheme } = useTheme();
  const [chosenTheme, setChosenTheme] = useState(theme);
  const [chosenReduced, setChosenReduced] = useState(reducedMotion);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = preferencesSchema.safeParse({ theme: chosenTheme, reducedMotion: chosenReduced });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Bitte Eingaben prüfen.");
      return;
    }

    setBusy(true);

    const res = await updatePreferencesAction(parsed.data);

    if (!res.ok) {
      setError(res.error);
      setBusy(false);
      return;
    }

    // next-themes entscheidet sich nach dem Speichern ebenfalls nach der neuen Vorgabe.
    setTheme(res.data.theme === "SYSTEM" ? "system" : res.data.theme.toLowerCase());
    toast("Einstellungen gespeichert.");
  }

  return (
    <form className="flex flex-col gap-4" noValidate onSubmit={submit}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="theme">Theme</Label>
        <Select
          value={chosenTheme}
          items={Object.entries(THEME_LABELS).map(([value, label]) => ({ value, label }))}
          onValueChange={(value) => setChosenTheme(String(value) as PreferencesInput["theme"])}
        >
          <SelectTrigger id="theme" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(THEME_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <Switch
          id="reducedMotion"
          checked={chosenReduced}
          onCheckedChange={(checked) => setChosenReduced(checked)}
        />
        <Label htmlFor="reducedMotion">Bewegungen reduzieren</Label>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert" aria-live="polite">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={busy}>
        Einstellungen speichern
      </Button>
    </form>
  );
}
