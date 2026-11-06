import { z } from "zod";

const orderType = z.enum(["REPAIR", "TUNING", "PAINT", "TOWING", "OTHER"]);

export const orderInputSchema = z.object({
  type: orderType,
  customerId: z.string().min(1),
  vehicleId: z.string().nullish().transform((v) => v ?? null),
  notes: z.string().trim().max(500).nullish().transform((v) => (v ? v : null)),
});

export const orderItemSchema = z.object({
  priceListItemId: z.string().min(1),
  quantity: z.number().int().min(1).max(50),
});

export const discountPercentSchema = z.number().int().min(0).max(100);

export type OrderInput = z.infer<typeof orderInputSchema>;
export type OrderItemInput = z.infer<typeof orderItemSchema>;
