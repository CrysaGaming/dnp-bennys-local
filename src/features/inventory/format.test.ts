import { describe, expect, it } from "vitest";
import { formatDelta, reasonLabel } from "./format";

describe("Bewegung formatieren", () => {
  it("Zugang mit Plus, Verlust und Korrektur mit Vorzeichen", () => {
    expect(formatDelta(3, "Stk")).toBe("+3 Stk");
    expect(formatDelta(-4, "Stk")).toBe("-4 Stk");
    expect(formatDelta(120, "kg")).toBe("+120 kg");
  });

  it("deutsche Namen für die Buchungsarten", () => {
    expect(reasonLabel("PURCHASE")).toBe("Zugang");
    expect(reasonLabel("CORRECTION")).toBe("Korrektur");
    expect(reasonLabel("LOSS")).toBe("Verlust");
    expect(reasonLabel("ORDER_USAGE")).toBe("Auftrag");
  });
});
