import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  toActionError,
  ForbiddenError,
  ConflictError,
  NotFoundError,
  BusinessRuleError,
  InsufficientStockError,
  InsufficientLoyaltyError,
} from "./errors";

describe("toActionError", () => {
  it("P2002 wird zu ConflictError mit Feld", () => {
    const err = { code: "P2002", meta: { target: ["sku"] } };
    const result = toActionError(err);
    expect(result.error).toBe("Bitte Eingaben prüfen.");
    expect(result.fieldErrors?.sku).toBeTruthy();
  });

  it("deutsche Meldungen", () => {
    expect(toActionError(new ForbiddenError())).toEqual({
      error: "Dafür fehlt dir die Berechtigung.",
    });
    expect(
      toActionError(new ConflictError("name", "Diese Ressource gibt es schon")),
    ).toEqual({
      error: "Bitte Eingaben prüfen.",
      fieldErrors: { name: "Diese Ressource gibt es schon" },
    });
    expect(toActionError(new InsufficientStockError())).toEqual({
      error: "Nicht genug auf Lager.",
    });
    expect(toActionError(new InsufficientLoyaltyError())).toEqual({
      error: "Nicht genug Stempel/Punkte.",
    });
    expect(toActionError(new BusinessRuleError("Du bist bereits eingestempelt."))).toEqual({
      error: "Du bist bereits eingestempelt.",
    });
    expect(toActionError(new NotFoundError())).toEqual({ error: "Das gibt es nicht." });
  });

  it("Zod-Fehler werden auf die Felder verteilt", () => {
    expect(
      toActionError(
        z.object({ name: z.string().min(2, "Mindestens 2 Zeichen") }).safeParse({ name: "a" })
          .error,
      ),
    ).toEqual({
      error: "Bitte Eingaben prüfen.",
      fieldErrors: { name: "Mindestens 2 Zeichen" },
    });
  });

  it("unbekannte Fehler werden nicht durchgereicht", () => {
    expect(toActionError(new Error("boom"))).toEqual({
      error: "Unerwarteter Fehler. Bitte erneut versuchen.",
    });
  });
});
