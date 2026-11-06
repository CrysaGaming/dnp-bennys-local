export type OrderListRow = {
  id: string;
  number: number;
  type: string;
  status: string;
  total: number;
  createdAt: Date;
  customer: { id: string; number: number; name: string };
  vehicle: { id: string; plate: string; model: string } | null;
};

export type OrderDetail = {
  id: string;
  number: number;
  type: string;
  status: string;
  total: number;
  subtotal: number;
  discountPercent: number;
  loyaltyDiscount: number;
  notes: string | null;
  customerId: string;
  customer: { id: string; number: number; name: string; loyaltyBalance: number };
  vehicle: { id: string; plate: string; model: string } | null;
  assignedToId: string | null;
  assignedTo: { id: string; name: string } | null;
  createdBy: { id: string; name: string };
  loyaltyRewardId: string | null;
  loyaltyReward: { id: string; name: string; cost: number } | null;
  invoice: { id: string; number: number; status: string } | null;
  items: Array<{ id: string; description: string; quantity: number; unitPrice: number; priceListItemId: string | null }>;
};

export type OrderFilter = {
  status?: string;
  type?: string;
  employeeId?: string;
  q?: string;
};
