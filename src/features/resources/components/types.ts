import type { ResourceCategory } from "@/generated/prisma/enums";

/** Die Form, die die reine Logik braucht. */
export type ResourceRowForFilter = {
  name: string;
  category: ResourceCategory;
  weightGrams: number;
  exportPrice: number;
};

export type ResourceViewRow = ResourceRowForFilter & {
  id: string;
  note: string | null;
};
