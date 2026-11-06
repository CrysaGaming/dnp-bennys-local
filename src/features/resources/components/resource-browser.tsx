"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_RESOURCE_QUERY,
  categoryCounts,
  filterAndSortResources,
  serializeResourceQuery,
  type ResourceQuery,
  type ResourceSort,
} from "../logic";
import { deleteResourceAction, listResourcesAction } from "../actions";
import { ResourceQuickAdd } from "./resource-quick-add";
import { ResourceFilters } from "./resource-filters";
import { ResourceTable } from "./resource-table";
import { ResourceEditDialog } from "./resource-edit-dialog";
import type { ResourceViewRow } from "./types";

export const SEARCH_DEBOUNCE_MS = 250;
export const HIGHLIGHT_MS = 1200;

/**
 * Datenbank aller Ressourcen (Spec 5.8). Der Zustand der Filtermaske steht in der URL, ein
 * Reload behält ihn. Die Liste wird nach jeder Änderung neu geholt – die Komponente ist die
 * einzige, die sie hält.
 */
export function ResourceBrowser({
  rows,
  canManage,
  initialQuery,
}: {
  rows: ResourceViewRow[];
  canManage: boolean;
  initialQuery: ResourceQuery;
}) {
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);

  const [data, setData] = useState(rows);
  const [query, setQuery] = useState(initialQuery);
  const [text, setText] = useState(initialQuery.q);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [editing, setEditing] = useState<ResourceViewRow | null>(null);

  const filtered = filterAndSortResources(data, query);

  function write(next: ResourceQuery) {
    setQuery(next);
    const qs = serializeResourceQuery(next);
    router.push(qs ? `?${qs}` : "/ressourcen", { scroll: false });
  }

  async function reload() {
    const res = await listResourcesAction();
    if (res.ok) setData(res.data as ResourceViewRow[]);
  }

  // Die Verzögerung gehört zur Suche, nicht zum Tippen selbst.
  useEffect(() => {
    const timer = setTimeout(() => write({ ...query, q: text }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // Der Query ändert sich nur durch diesen Effekt – alsabhängige wäre ein Kreislauf.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  // "/" fokussiert die Suche, aber nicht beim Tippen in einem Feld.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "/") return;

      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;

      e.preventDefault();
      searchRef.current?.focus();
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <ResourceQuickAdd
        canManage={canManage}
        onAdded={(id) => {
          setHighlightId(id);
          setTimeout(() => setHighlightId(null), HIGHLIGHT_MS);
          void reload();
        }}
      />

      <ResourceFilters
        text={text}
        query={query}
        counts={categoryCounts(data)}
        searchRef={searchRef}
        onText={setText}
        onToggleCategory={(category, on) => {
          const next = on ? [...query.categories, category] : query.categories.filter((c) => c !== category);
          write({ ...query, categories: next });
        }}
        onReset={() => {
          setText("");
          write(DEFAULT_RESOURCE_QUERY);
        }}
      />

      {data.length === 0 ? <p className="text-sm text-muted-foreground">Erste Ressource anlegen.</p> : null}

      {data.length > 0 && filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground mb-2">
          Keine Ressourcen gefunden.{" "}
          <Button variant="outline" size="sm" onClick={() => {
            setText("");
            write(DEFAULT_RESOURCE_QUERY);
          }}>
            Filter zurücksetzen
          </Button>
        </p>
      ) : null}

      <ResourceTable
        rows={filtered}
        query={query}
        canManage={canManage}
        highlightId={highlightId}
        onSort={(sort: ResourceSort) => write({ ...query, sort })}
        onEdit={(row) => setEditing(row)}
        onDelete={async (row) => {
          const res = await deleteResourceAction(row.id);
          if (!res.ok) {
            toast(res.error);
            return;
          }

          toast(`${row.name} gelöscht.`);
          await reload();
        }}
      />

      {editing ? (
        <ResourceEditDialog row={editing} open onClose={() => setEditing(null)} />
      ) : null}
    </>
  );
}
