"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { musicPreferenceSchema } from "../schemas";
import { setMusicPreferenceAction } from "../actions";
import type { MusicPreference } from "../service";

/** Musik im Dashboard (Spec 6.4): pro User, Standard ist aus, Lautstärke 35 %. */
export function MusicPreferencesForm({ initial }: { initial: MusicPreference }) {
  const [dashboardMusic, setDashboardMusic] = useState(initial.dashboardMusic);
  const [musicVolume, setMusicVolume] = useState(initial.musicVolume);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = musicPreferenceSchema.safeParse({ dashboardMusic, musicVolume });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Bitte Eingaben prüfen.");
      return;
    }

    setBusy(true);
    const res = await setMusicPreferenceAction(parsed.data);
    setBusy(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }

    toast("Musik-Einstellung gespeichert.");
  }

  return (
    <form className="flex flex-col gap-4" noValidate onSubmit={submit}>
      <div className="flex items-center gap-2">
        <Switch
          id="dashboard-music"
          aria-label="Musik im Dashboard"
          checked={dashboardMusic}
          onCheckedChange={setDashboardMusic}
        />
        <Label htmlFor="dashboard-music">Musik im Dashboard</Label>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="music-volume">Lautstärke (0–100)</Label>
        <Input
          id="music-volume"
          type="number"
          min={0}
          max={100}
          value={musicVolume}
          onChange={(e) => setMusicVolume(Number(e.target.value))}
        />
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert" aria-live="polite">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={busy}>
        Musik speichern
      </Button>
    </form>
  );
}
