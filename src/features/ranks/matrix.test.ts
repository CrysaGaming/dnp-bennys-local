import { describe, expect, it } from "vitest";
import { Permission } from "@/generated/prisma/enums";
import { PERMISSION_GROUPS, RANK_COLOR_PRESETS, groupState, toggleGroup } from "./matrix";

const res = PERMISSION_GROUPS.find((g) => g.group === "Ressourcen")!.permissions;

describe("matrix", () => {
  it("hat jede Gruppe in der Reihenfolge von Spec 5.9", () => {
    expect(PERMISSION_GROUPS.map((g) => g.group)).toEqual([
      "Kunden",
      "Ressourcen",
      "Aufträge",
      "Rechnungen",
      "Lager",
      "Preisliste",
      "Mitarbeiter",
      "Ränge",
      "Dienstzeiten",
      "Verwaltung",
    ]);
  });

  it("zeigt „some“, wenn nur ein Recht der Gruppe gewählt ist", () => {
    expect(groupState(["RESOURCES_VIEW"], res)).toBe("some");
  });

  it("zeigt „all“, wenn die ganze Gruppe gewählt ist", () => {
    expect(groupState(res, res)).toBe("all");
    expect(groupState([], res)).toBe("none");
  });

  it("wählt die ganze Gruppe", () => {
    expect(new Set(toggleGroup([], res, true))).toEqual(new Set(res));
  });

  it("nimmt die ganze Gruppe ab", () => {
    expect(toggleGroup(res, res, false)).toEqual([]);
  });

  it("deckt alle Rechte der Perm-Meta ab", () => {
    expect(PERMISSION_GROUPS.flatMap((g) => g.permissions).sort()).toEqual(Object.values(Permission).sort());
  });

  it("hat die acht Vorgabenfarben", () => {
    expect(RANK_COLOR_PRESETS).toEqual([
      "#FF2E88",
      "#FF8A3D",
      "#7C3AED",
      "#22D3EE",
      "#22C55E",
      "#EAB308",
      "#A1A1AA",
      "#F4F4F5",
    ]);
  });
});
