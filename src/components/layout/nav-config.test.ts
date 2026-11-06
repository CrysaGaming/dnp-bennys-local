import { describe, expect, it } from "vitest";
import { fakeCtx } from "@tests/helpers/factories";
import { NAV_GROUPS, visibleNav } from "./nav-config";

describe("nav-config", () => {
  it("zeigt dem Admin alle Gruppen", () => {
    expect(visibleNav(NAV_GROUPS, fakeCtx({ isAdmin: true })).map((g) => g.title)).toEqual([
      "Übersicht",
      "Kunden",
      "Betrieb",
      "Ressourcen",
      "Team",
      "Verwaltung",
    ]);
  });

  it("ohne Rechte bleiben die rechtenfreien Einträge und leere Gruppen fallen raus", () => {
    const none = visibleNav(NAV_GROUPS, fakeCtx({ permissions: [] }));

    expect(none.map((g) => g.title)).toEqual(["Übersicht", "Kunden", "Betrieb", "Team"]);
    expect(none.find((g) => g.title === "Betrieb")!.items.map((i) => i.title)).toEqual([
      "Preisliste",
    ]);
    expect(none.find((g) => g.title === "Kunden")!.items.map((i) => i.title)).toEqual([
      "Treueprämien",
      "Treue-Einstellungen",
    ]);
    expect(none.find((g) => g.title === "Team")!.items.map((i) => i.title)).toEqual([
      "Dienstzeiten",
    ]);
  });

  it("zeigt eine Gruppe, sobald ihr Recht da ist", () => {
    expect(
      visibleNav(NAV_GROUPS, fakeCtx({ permissions: ["RESOURCES_VIEW"] })).map((g) => g.title),
    ).toContain("Ressourcen");
  });

  it("jeder Eintrag hat Titel, Href und Icon", () => {
    for (const group of NAV_GROUPS) {
      for (const item of group.items) {
        expect(item.title).toBeTruthy();
        expect(item.href.startsWith("/")).toBe(true);
        expect(["function", "object"]).toContain(typeof item.icon);
      }
    }
  });
});
