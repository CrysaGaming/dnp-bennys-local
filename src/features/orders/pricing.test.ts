import { describe, expect, it } from "vitest";
import { calcOrderTotals } from "./pricing";

const items = [
  { quantity: 2, unitPrice: 250, priceListItemId: "oel" },
  { quantity: 1, unitPrice: 1000, priceListItemId: "tuning" },
];

describe("calcOrderTotals", () => {
  it("ohne Rabatt und ohne Prämie", () => {
    expect(calcOrderTotals({ items, discountPercent: 0, reward: null })).toEqual({
      subtotal: 1500,
      afterDiscount: 1500,
      loyaltyDiscount: 0,
      total: 1500,
    });
  });

  it("Rundung auf ganze Dollar", () => {
    expect(calcOrderTotals({ items, discountPercent: 10, reward: null }).total).toBe(1350);
    // Der Plan hatte hier 850. 999 × (1 − 0,15) = 849,15, kaufmännisch gerundet ist 849 –
    // die 850 im Plan ist ein Rechenfehler, die Formel aus Spec 7.5 bleibt. Zur Sicherheit
    // ein zweiter Fall, bei dem die Rundung wirklich entscheidet: 1050 × 0,15 = 157,5 → 158.
    expect(
      calcOrderTotals({
        items: [{ quantity: 1, unitPrice: 999, priceListItemId: null }],
        discountPercent: 15,
        reward: null,
      }).afterDiscount,
    ).toBe(849);
    expect(
      calcOrderTotals({
        items: [{ quantity: 1, unitPrice: 1050, priceListItemId: null }],
        discountPercent: 15,
        reward: null,
      }),
    ).toEqual({ subtotal: 1050, afterDiscount: 893, loyaltyDiscount: 0, total: 893 });
  });

  it("Prozent-Prämie auf den rabattierten Betrag", () => {
    expect(
      calcOrderTotals({
        items,
        discountPercent: 10,
        reward: { type: "PERCENT_DISCOUNT", value: 20, priceListItemId: null },
      }),
    ).toEqual({ subtotal: 1500, afterDiscount: 1350, loyaltyDiscount: 270, total: 1080 });
  });

  it("fester Rabatt und Gratisleistung", () => {
    expect(calcOrderTotals({ items, discountPercent: 10, reward: { type: "FIXED_DISCOUNT", value: 250, priceListItemId: null } }).total).toBe(1100);
  });

  it("ein Rabatt kann nie über den offenen Betrag hinausgehen", () => {
    expect(
      calcOrderTotals({
        items,
        discountPercent: 10,
        reward: { type: "FIXED_DISCOUNT", value: 5000, priceListItemId: null },
      }),
    ).toMatchObject({ loyaltyDiscount: 1350, total: 0 });
  });

  it("Gratisleistung rechnet nur die Leistung, die in der Liste steht", () => {
    expect(
      calcOrderTotals({
        items,
        discountPercent: 0,
        reward: { type: "FREE_SERVICE", value: 0, priceListItemId: "oel" },
      }),
    ).toMatchObject({ loyaltyDiscount: 250, total: 1250 });

    expect(
      calcOrderTotals({
        items,
        discountPercent: 0,
        reward: { type: "FREE_SERVICE", value: 0, priceListItemId: "fehlt" },
      }).loyaltyDiscount,
    ).toBe(0);
  });

  it("leere Liste", () => {
    expect(calcOrderTotals({ items: [], discountPercent: 0, reward: null }).total).toBe(0);
  });
});
