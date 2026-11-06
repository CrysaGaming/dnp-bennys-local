export type RewardRow = {
  id: string;
  name: string;
  description: string | null;
  type: string;
  value: number;
  cost: number;
  active: boolean;
  sortOrder: number;
  itemName: string | null;
};
