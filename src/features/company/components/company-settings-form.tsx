"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { updateCompanySettingsAction } from "../actions";
import { companySettingsSchema, type CompanySettingsInput } from "../schemas";
import type { CompanySettings } from "../service";
import { LogoPicker } from "./logo-picker";
import { LogoPreview, type LogoPreviewTheme } from "./logo-preview";

/**
 * Firmeneinstellungen (Spec 5.10 / 5.11). Ohne `COMPANY_MANAGE` ist alles
 * schreibgeschützt – die Rechteprüfung passiert trotzdem in der Fachfunktion.
 */
export function CompanySettingsForm({
  settings,
  canManage,
}: {
  settings: CompanySettings;
  canManage: boolean;
}) {
  const initial: CompanySettingsInput = {
    name: settings.name,
    phone: settings.phone ?? "",
    radioChannel: settings.radioChannel ?? "",
    radioPassword: settings.radioPassword ?? "",
    statusMode: settings.statusMode,
    manualOpen: settings.manualOpen,
    minOnDuty: settings.minOnDuty,
    logoVariant: settings.logoVariant,
  };

  const [form, setForm] = useState(initial);
  const [picked, setPicked] = useState(settings.logoVariant);
  const [previewTheme, setPreviewTheme] = useState<LogoPreviewTheme>("dark");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set<K extends keyof CompanySettingsInput>(key: K, value: CompanySettingsInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save(input: CompanySettingsInput, message = "Firmeneinstellungen gespeichert.") {
    setError(null);

    const parsed = companySettingsSchema.safeParse(input);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Bitte Eingaben prüfen.");
      return;
    }

    setBusy(true);
    const res = await updateCompanySettingsAction(parsed.data);
    setBusy(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }

    setForm({ ...parsed.data, phone: parsed.data.phone ?? "" });
    toast(message);
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Logo</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <LogoPicker
            value={picked}
            saved={settings.logoVariant}
            companyName={settings.name}
            onChange={(variant) => setPicked(variant)}
            disabled={!canManage}
          />

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Ansicht</span>
            <RadioGroup
              value={previewTheme}
              onValueChange={(value) => setPreviewTheme(value as LogoPreviewTheme)}
              className="flex gap-3"
            >
              {(["dark", "light"] as const).map((theme) => (
                <Label key={theme} htmlFor={`preview-${theme}`} className="flex items-center gap-2">
                  <RadioGroupItem id={`preview-${theme}`} value={theme} aria-label={theme === "dark" ? "Dunkel" : "Hell"} />
                  <span>{theme === "dark" ? "Dunkel" : "Hell"}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          <LogoPreview variant={picked} companyName={settings.name} theme={previewTheme} />

          <Button
            type="button"
            disabled={!canManage || busy}
            onClick={() => save({ ...form, logoVariant: picked }, "Logo übernommen.")}
          >
            Logo übernehmen
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Firmendaten</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" noValidate onSubmit={(e) => { e.preventDefault(); void save(form); }}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="firmenname">Firmenname</Label>
              <Input
                id="firmenname"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                disabled={!canManage}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="telefon">Telefon</Label>
              <Input
                id="telefon"
                inputMode="tel"
                placeholder="555-0123"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                disabled={!canManage}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="funk-kanal">Radio-Kanal</Label>
                <Input
                  id="funk-kanal"
                  placeholder="1234"
                  value={form.radioChannel}
                  onChange={(e) => set("radioChannel", e.target.value)}
                  disabled={!canManage}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="funk-passwort">Funk-Passwort</Label>
                <Input
                  id="funk-passwort"
                  placeholder="0000"
                  value={form.radioPassword}
                  onChange={(e) => set("radioPassword", e.target.value)}
                  disabled={!canManage}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="status-modus">Status-Modus</Label>
                <Select
                  value={form.statusMode}
                  onValueChange={(value) => set("statusMode", value as CompanySettingsInput["statusMode"])}
                  disabled={!canManage}
                >
                  <SelectTrigger id="status-modus" aria-label="Status-Modus" className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AUTO">Automatisch</SelectItem>
                    <SelectItem value="MANUAL">Manuell</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="min-on-duty">Mindestens im Dienst</Label>
                <Input
                  id="min-on-duty"
                  type="number"
                  min={1}
                  max={20}
                  value={form.minOnDuty}
                  onChange={(e) => set("minOnDuty", Number(e.target.value))}
                  disabled={!canManage}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="manual-open"
                checked={form.manualOpen}
                onCheckedChange={(checked) => set("manualOpen", checked)}
                disabled={!canManage}
              />
              <Label htmlFor="manual-open">Manuell auf „Geöffnet“ stellen</Label>
            </div>

            {error ? (
              <p className="text-sm text-destructive" role="alert" aria-live="polite">
                {error}
              </p>
            ) : null}

            <Button type="submit" disabled={!canManage || busy}>
              Speichern
            </Button>

            {!canManage && (
              <p className="text-xs text-muted-foreground">
                Ohne das Recht „Firmeneinstellungen“ kann hier nichts geändert werden.
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
