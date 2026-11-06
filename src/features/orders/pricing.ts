import type { RewardType } from "@/generated/prisma/enums";

export type PricingItem = {
  quantity: number;
  unitPrice: number;
  priceListItemId: string | null;
};

export type PricingReward = {
  type: RewardType;
  value: number;
  priceListItemId: string | null;
} | null;

export type OrderTotals = {
  subtotal: number;
  afterDiscount: number;
  loyaltyDiscount: number;
  total: number;
};

/**
 * Preisberechnung (Spec 7.5). Ganze Dollar, kaufmännisch gerundet. Eine Prämie kann nie mehr
 * abziehen als der offene Betrag – sonst würde die Rechnung negativ.
 */
export function calcOrderTotals(input: {
  items: PricingItem[];
  discountPercent: number;
  reward: PricingReward;
}): OrderTotals {
  const round = (n: number) => Math.round(n);

  const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const afterDiscount = round(subtotal * (1 - input.discountPercent / 100));

  let loyaltyDiscount = 0;

  if (input.reward) {
    switch (input.reward.type) {
      case "PERCENT_DISCOUNT":
        loyaltyDiscount = round(afterDiscount * (input.reward.value / 100));
        break;
      case "FIXED_DISCOUNT":
        loyaltyDiscount = input.reward.value;
        break;
      case "FREE_SERVICE": {
        const free = input.items.find((item) => item.priceListItemId === input.reward?.priceListItemId);
        loyaltyDiscount = free ? free.unitPrice : 0;
        break;
      }
    }
  }

  if (loyaltyDiscount > afterDiscount) loyaltyDiscount = afterDiscount;

  return { subtotal, afterDiscount, loyaltyDiscount, total: afterDiscount - loyaltyDiscount };
}
