import { describe, expect, it } from "vitest";
import { nextReward, pointsProgress, stampCardView, stampRotation } from "./card";

describe("Stempelkarte", () => {
  it("volle Karten und das aktuelle Feld", () => {
    expect(stampCardView(0, 10)).toEqual({ fullCards: 0, current: 0 });
    expect(stampCardView(7, 10)).toEqual({ fullCards: 0, current: 7 });
    // Eine volle Karte ist noch die aktuelle Karte – erst danach zählt sie als voll.
    expect(stampCardView(10, 10)).toEqual({ fullCards: 0, current: 10 });
    expect(stampCardView(13, 10)).toEqual({ fullCards: 1, current: 3 });
    expect(stampCardView(20, 10)).toEqual({ fullCards: 1, current: 10 });
    expect(stampCardView(21, 10)).toEqual({ fullCards: 2, current: 1 });
  });

  it("nächste Prämie ist die billigste, die noch nicht reicht", () => {
    expect(nextReward([{ name: "teuer", cost: 20 }, { name: "billig", cost: 10 }], 7)?.name).toBe("billig");
    expect(nextReward([{ name: "schon frei", cost: 5 }], 7)).toBeNull();
  });

  it("Fortschritt zum Balken", () => {
    expect(pointsProgress(30, 50)).toBe(60);
    expect(pointsProgress(0, 10)).toBe(0);
    expect(pointsProgress(12, 10)).toBe(100);
    expect(pointsProgress(5, 0)).toBe(0);
  });

  it("Drehung bleibt ganzzahlig im Bereich und ist gleich für denselben Index", () => {
    for (let i = 0; i < 20; i++) {
      const value = stampRotation(i);
      expect(Number.isInteger(value)).toBe(true);
      expect(Math.abs(value)).toBeLessThanOrEqual(8);
    }

    expect(stampRotation(3)).toBe(stampRotation(3));
    expect(stampRotation(3)).not.toBe(stampRotation(4));
  });
});
