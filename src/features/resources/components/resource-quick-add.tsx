"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { createResourceAction } from "../actions";
import { CATEGORY_LABEL, CATEGORY_ORDER } from "../logic";
import type { ResourceCategory } from "@/generated/prisma/enums";

const LAST_CATEGORY_KEY = "bennys:resource-last-category";

/** Die zuletzt gewählte Kategorie bleibt als Komfort-Einstellung erhalten (Spec 5.8). */
function readLastCategory(): ResourceCategory {
  try {
    const raw = localStorage.getItem(LAST_CATEGORY_KEY);
    if (raw && (CATEGORY_ORDER as string[]).includes(raw)) return raw as ResourceCategory;
  } catch {
    /* privater Modus oder kein Speicher – Standard ist Rohstoff */
  }

  return "RAW";
}

function saveLastCategory(category: ResourceCategory): void {
  try {
    localStorage.setItem(LAST_CATEGORY_KEY, category);
  } catch {
    /* Komfort, keine Daten – Fehler sind hier egal */
  }
}

/**
 * Schnelleingabe oben im Main-Content (Spec 5.8). Nach dem Speichern: Felder leer, Fokus
 * zurück auf das Namensfeld, Toast, und die neue Zeile wird kurz hervorgehoben.
 */
export function ResourceQuickAdd({
  canManage,
  onAdded,
}: {
  canManage: boolean;
  onAdded: (id: string) => void;
}) {
  const nameRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<ResourceCategory>(() => readLastCategory());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!canManage) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    setBusy(true);
    const res = await createResourceAction({ name, weight, exportPrice: price, category });
    setBusy(false);

    if (!res.ok) {
      setError(res.fieldErrors?.name ?? res.error);
      return;
    }

    const created = res.data as { id: string; name: string };

    setName("");
    setWeight("");
    setPrice("");
    saveLastCategory(category);
    onAdded(created.id);
    toast(`${created.name} hinzugefügt`);
    nameRef.current?.focus();
  }

  return (
    <section className="mb-6">
      <h2 className="text-lg font-semibold mb-3">Ressource hinzufügen</h2>

      <form className="flex flex-wrap items-end gap-3" noValidate onSubmit={submit}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="resource-name">Name</Label>
          <Input
            id="resource-name"
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="resource-weight">Gewicht (kg)</Label>
          <Input
            id="resource-weight"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            inputMode="decimal"
            autoComplete="off"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="resource-price">Export-Preis ($)</Label>
          <Input
            id="resource-price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="numeric"
            autoComplete="off"
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Kategorie</span>
          <ToggleGroup
            value={[category]}
            onValueChange={(value) => value[0] && setCategory(value[0] as ResourceCategory)}
            aria-label="Kategorie"
            role="radiogroup"
          >
            {CATEGORY_ORDER.map((c) => (
              <ToggleGroupItem
                key={c}
                value={c}
                role="radio"
                aria-checked={category === c}
                aria-label={CATEGORY_LABEL[c]}
              >
                {CATEGORY_LABEL[c]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <Button type="submit" disabled={busy}>
          Hinzufügen
        </Button>

        {error ? (
          <p className="text-sm text-destructive basis-full" role="alert" aria-live="polite">
            {error}
          </p>
        ) : null}
      </form>
    </section>
  );
}
