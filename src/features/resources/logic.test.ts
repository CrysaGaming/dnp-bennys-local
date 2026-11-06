import { describe, expect, it } from "vitest";
import {
  CATEGORY_LABEL,
  DEFAULT_RESOURCE_QUERY,
  categoryCounts,
  filterAndSortResources,
  parseResourceQuery,
  pricePerKg,
  serializeResourceQuery,
  type ResourceQuery,
} from "./logic";
import type { ResourceCategory } from "@/generated/prisma/enums";

type Row = {
  id: string;
  name: string;
  category: ResourceCategory;
  weightGrams: number;
  exportPrice: number;
};

const rows: Row[] = [
  { id: "1", name: "Eisenerz", category: "RAW", weightGrams: 2500, exportPrice: 45 },
  { id: "2", name: "Stahlbarren", category: "INTERMEDIATE", weightGrams: 1500, exportPrice: 180 },
  { id: "3", name: "Motorblock", category: "FINAL", weightGrams: 25000, exportPrice: 2400 },
  { id: "4", name: "Kupfererz", category: "RAW", weightGrams: 2000, exportPrice: 60 },
];

function names(q: Partial<ResourceQuery>): string[] {
  return filterAndSortResources(rows, { ...DEFAULT_RESOURCE_QUERY, ...q }).map((r) => r.name);
}

describe("Ressourcen-Logik", () => {
  it("deutsche Kategorienamen", () => {
    expect(CATEGORY_LABEL).toEqual({
      RAW: "Rohstoff",
      INTERMEDIATE: "Zwischenprodukt",
      FINAL: "Endprodukt",
    });
  });

  it("$ / kg", () => {
    expect(pricePerKg(45, 2500)).toBe(18);
    expect(pricePerKg(180, 1500)).toBe(120);
    expect(pricePerKg(2400, 25000)).toBe(96);
    expect(pricePerKg(60, 2000)).toBe(30);
    expect(pricePerKg(10, 0)).toBeNull();
  });

  it("Suchung findet beide Erze", () => {
    expect(names({ q: "erz" })).toEqual(["Eisenerz", "Kupfererz"]);
    expect(names({ q: "ERZ" })).toEqual(["Eisenerz", "Kupfererz"]);
  });

  it("Kategorie-Filter mit Standardsortierung nach Name", () => {
    expect(names({ categories: ["RAW", "FINAL"] })).toEqual(["Eisenerz", "Kupfererz", "Motorblock"]);
    expect(names({ categories: ["RAW"], q: "eisen" })).toEqual(["Eisenerz"]);
    expect(names({ categories: [] })).toEqual([
      "Eisenerz",
      "Kupfererz",
      "Motorblock",
      "Stahlbarren",
    ]);
  });

  it("Sortierung nach Kategorie folgt Rohstoff, Zwischenprodukt, Endprodukt", () => {
    expect(names({ sort: "category.asc" })).toEqual([
      "Eisenerz",
      "Kupfererz",
      "Stahlbarren",
      "Motorblock",
    ]);
    expect(names({ sort: "category.desc" })).toEqual([
      "Motorblock",
      "Stahlbarren",
      "Eisenerz",
      "Kupfererz",
    ]);
  });

  it("Sortierung", () => {
    expect(names({ sort: "perKg.desc" })).toEqual(["Stahlbarren", "Motorblock", "Kupfererz", "Eisenerz"]);
    expect(names({ sort: "exportPrice.asc" })).toEqual(["Eisenerz", "Kupfererz", "Stahlbarren", "Motorblock"]);
    expect(names({ sort: "weight.desc" })).toEqual(["Motorblock", "Eisenerz", "Kupfererz", "Stahlbarren"]);
    expect(names({ sort: "name.desc" })).toEqual([
      "Stahlbarren",
      "Motorblock",
      "Kupfererz",
      "Eisenerz",
    ]);
  });

  it("ohne Gewicht steht der Wert am Ende, egal ob auf- oder absteigend", () => {
    const withZero: Row[] = [
      ...rows,
      { id: "5", name: "Schrauben", category: "FINAL", weightGrams: 0, exportPrice: 5 },
    ];

    const sorted = filterAndSortResources(withZero, {
      ...DEFAULT_RESOURCE_QUERY,
      sort: "perKg.desc",
    }).map((r) => r.name);

    expect(sorted).toEqual(["Stahlbarren", "Motorblock", "Kupfererz", "Eisenerz", "Schrauben"]);

    const asc = filterAndSortResources(withZero, {
      ...DEFAULT_RESOURCE_QUERY,
      sort: "perKg.asc",
    }).map((r) => r.name);

    expect(asc[asc.length - 1]).toBe("Schrauben");
  });

  it("URL liest und schreibt die Filtermaske", () => {
    expect(
      parseResourceQuery(new URLSearchParams("q=erz&kat=RAW,FINAL&sort=exportPrice.desc")),
    ).toEqual({ q: "erz", categories: ["RAW", "FINAL"], sort: "exportPrice.desc" });

    expect(parseResourceQuery(new URLSearchParams("kat=FOO&sort=bogus"))).toEqual(
      DEFAULT_RESOURCE_QUERY,
    );

    expect(serializeResourceQuery(DEFAULT_RESOURCE_QUERY)).toBe("");
    expect(serializeResourceQuery({ q: "erz", categories: ["RAW"], sort: "name.asc" })).toBe(
      "q=erz&kat=RAW",
    );
    expect(
      serializeResourceQuery({ q: "erz", categories: ["RAW", "FINAL"], sort: "weight.desc" }),
    ).toBe("q=erz&kat=RAW,FINAL&sort=weight.desc");
  });

  it("Zahlen pro Kategorie", () => {
    expect(categoryCounts(rows)).toEqual({ RAW: 2, INTERMEDIATE: 1, FINAL: 1 });
  });
});
