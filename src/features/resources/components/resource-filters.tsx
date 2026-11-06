"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CATEGORY_LABEL, CATEGORY_ORDER } from "../logic";
import type { ResourceQuery } from "../logic";
import type { ResourceCategory } from "@/generated/prisma/enums";

/**
 * Filtermaske (Spec 5.8). Der Text und die Verzögerung liegen beim Browser – hier wird nur
 * gezeigt, was der Browser hält. Sonst würde ein „Filter zurücksetzen“ zwei Zustände haben.
 */
export function ResourceFilters({
  text,
  query,
  counts,
  searchRef,
  onText,
  onToggleCategory,
  onReset,
}: {
  text: string;
  query: ResourceQuery;
  counts: Record<ResourceCategory, number>;
  searchRef: React.RefObject<HTMLInputElement | null>;
  onText: (value: string) => void;
  onToggleCategory: (category: ResourceQuery["categories"][number], on: boolean) => void;
  onReset: () => void;
}) {
  return (
    <section className="flex flex-wrap items-start gap-4 mb-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="resource-search">Suchen …</Label>
        <Input
          id="resource-search"
          ref={searchRef}
          value={text}
          onChange={(e) => onText(e.target.value)}
          placeholder="Suchen …"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Kategorie</span>

        {CATEGORY_ORDER.map((c) => (
          <div key={c} className="flex items-center gap-2">
            <Checkbox
              id={`filter-${c}`}
              checked={query.categories.includes(c)}
              onCheckedChange={(checked) => onToggleCategory(c, checked === true)}
            />
            <Label htmlFor={`filter-${c}`}>
              {CATEGORY_LABEL[c]} ({counts[c]})
            </Label>
          </div>
        ))}
      </div>

      <Button variant="outline" onClick={onReset}>
        Filter zurücksetzen
      </Button>
    </section>
  );
}
