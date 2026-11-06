import { describe, expect, it } from "vitest";
import { ALLOWED_TRANSITIONS, canEditOrder, canTransition } from "./status";
import { fakeCtx } from "@tests/helpers/factories";
import type { SessionContext } from "@/lib/session-types";

function ctx(permissions: SessionContext["permissions"], employeeId: string): SessionContext {
  return { ...(fakeCtx({ permissions }) as SessionContext), employeeId };
}

describe("Statusübergänge", () => {
  it("die Tabelle ist die einzige Quelle für erlaubte Übergänge", () => {
    expect(ALLOWED_TRANSITIONS).toEqual({
      OPEN: ["IN_PROGRESS", "DONE", "CANCELLED"],
      IN_PROGRESS: ["DONE", "CANCELLED"],
      DONE: ["CANCELLED"],
      CANCELLED: [],
    });
  });

  it("open darf fertig werden", () => {
    expect(canTransition("OPEN", "DONE")).toBe(true);
    expect(canTransition("OPEN", "IN_PROGRESS")).toBe(true);
    expect(canTransition("IN_PROGRESS", "DONE")).toBe(true);
    expect(canTransition("DONE", "CANCELLED")).toBe(true);
  });

  it("ein fertigender Auftrag geht nicht zurück", () => {
    expect(canTransition("DONE", "IN_PROGRESS")).toBe(false);
    expect(canTransition("CANCELLED", "OPEN")).toBe(false);
    expect(canTransition("CANCELLED", "DONE")).toBe(false);
  });
});

describe("canEditOrder", () => {
  it("fremder Auftrag ohne ORDERS_MANAGE ist gesperrt", () => {
    const me = ctx(["ORDERS_VIEW"], "ich");
    expect(canEditOrder(me, { createdById: "andere", assignedToId: null })).toBe(false);
    expect(canEditOrder(me, { createdById: "andere", assignedToId: "andere" })).toBe(false);
  });

  it("mit ORDERS_MANAGE darf man fremde Aufträge ändern", () => {
    const me = ctx(["ORDERS_VIEW", "ORDERS_MANAGE"], "ich");
    expect(canEditOrder(me, { createdById: "andere", assignedToId: null })).toBe(true);
    expect(canEditOrder(me, { createdById: "andere", assignedToId: "ich" })).toBe(true);
  });

  it("den eigenen Auftrag darf man auch ohne Extra-Recht ändern", () => {
    const me = ctx(["ORDERS_VIEW"], "ich");
    expect(canEditOrder(me, { createdById: "ich", assignedToId: null })).toBe(true);
    expect(canEditOrder(me, { createdById: "andere", assignedToId: "ich" })).toBe(true);
  });
});
