import type { ResourceCategory } from "@/generated/prisma/enums";

export const CATEGORY_LABEL: Record<ResourceCategory, string> = {
  RAW: "Rohstoff",
  INTERMEDIATE: "Zwischenprodukt",
  FINAL: "Endprodukt",
};

/** Die Filtermaske zeigt die Kategorien in dieser Reihenfolge (Spec 5.8). */
export const CATEGORY_ORDER: ResourceCategory[] = ["RAW", "INTERMEDIATE", "FINAL"];

const SORT_FIELDS = ["name", "category", "weight", "exportPrice", "perKg"] as const;
const SORT_DIRECTIONS = ["asc", "desc"] as const;

export type ResourceSort = `${(typeof SORT_FIELDS)[number]}.${(typeof SORT_DIRECTIONS)[number]}`;

export type ResourceRowShape = {
  name: string;
  category: ResourceCategory;
  weightGrams: number;
  exportPrice: number;
};

export type ResourceQuery = {
  q: string;
  categories: ResourceCategory[];
  sort: ResourceSort;
};

export const DEFAULT_RESOURCE_QUERY: ResourceQuery = {
  q: "",
  categories: [],
  sort: "name.asc",
};

export function isSort(value: string): value is ResourceSort {
  const [field, dir] = value.split(".");
  return SORT_FIELDS.includes(field as (typeof SORT_FIELDS)[number]) &&
    SORT_DIRECTIONS.includes(dir as (typeof SORT_DIRECTIONS)[number]);
}

export function pricePerKg(exportPrice: number, weightGrams: number): number | null {
  if (weightGrams === 0) return null;
  return Math.round(exportPrice / (weightGrams / 1000));
}

function numericValue(row: ResourceRowShape, field: (typeof SORT_FIELDS)[number]): number | null {
  if (field === "perKg") return pricePerKg(row.exportPrice, row.weightGrams);
  if (field === "weight") return row.weightGrams;
  if (field === "exportPrice") return row.exportPrice;
  return null;
}

export function filterAndSortResources<T extends ResourceRowShape>(
  rows: T[],
  query: ResourceQuery,
): T[] {
  const q = query.q.trim().toLowerCase();

  const filtered = rows.filter((row) => {
    const matchesText = q === "" || row.name.toLowerCase().includes(q);
    const matchesCategory =
      query.categories.length === 0 || query.categories.includes(row.category);
    return matchesText && matchesCategory;
  });

  const [field, dir] = query.sort.split(".") as [(typeof SORT_FIELDS)[number], "asc" | "desc"];
  const sign = dir === "asc" ? 1 : -1;

  return [...filtered].sort((a, b) => {
    if (field === "name") return sign * a.name.localeCompare(b.name, "de");

    if (field === "category") {
      return sign * (CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category));
    }

    const av = numericValue(a, field);
    const bv = numericValue(b, field);

    // Ein Wert ohne Gewicht bleibt am Ende, egal in welche Richtung sortiert wird.
    if (av === null && bv === null) return 0;
    if (av === null) return 1;
    if (bv === null) return -1;

    return sign * (av - bv);
  });
}

export function parseResourceQuery(sp: URLSearchParams): ResourceQuery {
  const rawCategories = (sp.get("kat") ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter((c) => (CATEGORY_ORDER as string[]).includes(c)) as ResourceCategory[];

  const sort = sp.get("sort") ?? "";

  return {
    q: sp.get("q") ?? "",
    categories: rawCategories,
    sort: isSort(sort) ? sort : DEFAULT_RESOURCE_QUERY.sort,
  };
}

/** Nur was vom Standard abweicht, kommt in die URL. */
export function serializeResourceQuery(query: ResourceQuery): string {
  const parts: string[] = [];

  if (query.q !== "") parts.push(`q=${encodeURIComponent(query.q)}`);
  if (query.categories.length > 0) parts.push(`kat=${query.categories.join(",")}`);
  if (query.sort !== DEFAULT_RESOURCE_QUERY.sort) parts.push(`sort=${query.sort}`);

  return parts.join("&");
}

export function categoryCounts(rows: ResourceRowShape[]): Record<ResourceCategory, number> {
  const counts = { RAW: 0, INTERMEDIATE: 0, FINAL: 0 } as Record<ResourceCategory, number>;

  for (const row of rows) counts[row.category] += 1;

  return counts;
}
