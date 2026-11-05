import { describe, it, expect } from "vitest";
import { Permission } from "@/generated/prisma/enums";
import {
  PERMISSION_META,
  withImplied,
  togglePermission,
  hasPermission,
  assertPermission,
  outranks,
} from "./permissions";
import { ForbiddenError } from "./errors";
import { fakeCtx } from "@tests/helpers/ctx";

describe("PERMISSION_META", () => {
  it("hat Meta für jedes Recht", () => {
    expect(Object.keys(PERMISSION_META).sort()).toEqual(Object.values(Permission).sort());
  });

  it("jedes Recht hat Label und Gruppe", () => {
    for (const meta of Object.values(PERMISSION_META)) {
      expect(meta.label.length).toBeGreaterThan(0);
      expect(meta.group.length).toBeGreaterThan(0);
    }
  });
});

describe("Rechte-Logik", () => {
  it("Verwalten zieht Ansehen mit", () => {
    expect(new Set(togglePermission([], "RESOURCES_MANAGE", true))).toEqual(
      new Set(["RESOURCES_MANAGE", "RESOURCES_VIEW"]),
    );
  });

  it("Ansehen abwählen entfernt abhängige Rechte", () => {
    expect(
      togglePermission(
        ["CUSTOMERS_VIEW", "CUSTOMERS_EDIT", "LOYALTY_MANAGE"],
        "CUSTOMERS_VIEW",
        false,
      ),
    ).toEqual([]);
  });

  it("withImplied ergänzt", () => {
    expect(withImplied(["ORDERS_MANAGE"])).toContain("ORDERS_VIEW");
  });

  it("Admin-Rolle hat alles", () => {
    expect(hasPermission(fakeCtx({ isAdmin: true, permissions: [] }), "AUDIT_VIEW")).toBe(true);
  });

  it("fehlendes Recht", () => {
    expect(hasPermission(fakeCtx({ permissions: ["ORDERS_VIEW"] }), "ORDERS_MANAGE")).toBe(false);
  });

  it("assertPermission wirft", () => {
    expect(() => assertPermission(fakeCtx({ permissions: [] }), "RANKS_MANAGE")).toThrow(
      ForbiddenError,
    );
  });

  it("outranks", () => {
    expect(outranks(fakeCtx({ rank: { ...fakeCtx().rank, level: 30 } }), 20)).toBe(true);
    expect(outranks(fakeCtx({ rank: { ...fakeCtx().rank, level: 30 } }), 30)).toBe(false);
    expect(outranks(fakeCtx({ isAdmin: true }), 99)).toBe(true);
  });
});
