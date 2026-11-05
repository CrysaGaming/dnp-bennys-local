import type { Permission } from "@/generated/prisma/enums";

/** Kontext des eingeloggten Mitarbeiters (Plan 0.5 / Task 1.2). */
export type SessionContext = {
  userId: string;
  username: string;
  name: string;
  image: string | null;
  isAdmin: boolean;
  employeeId: string;
  mustChangePassword: boolean;
  rank: {
    id: string;
    name: string;
    level: number;
    color: string;
    isSystem: boolean;
  };
  permissions: Permission[];
};
