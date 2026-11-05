import type { SessionContext } from "@/lib/session-types";
import type { Permission } from "@/generated/prisma/enums";

/** Kontext für Unit-Tests – ohne DB. */
export function fakeCtx(overrides: Partial<SessionContext> = {}): SessionContext {
  return {
    userId: "user-1",
    username: "testuser",
    name: "Test User",
    image: null,
    isAdmin: false,
    employeeId: "employee-1",
    mustChangePassword: false,
    rank: {
      id: "rank-1",
      name: "Testrang",
      level: 10,
      color: "#A1A1AA",
      isSystem: false,
    },
    permissions: [] as Permission[],
    ...overrides,
  };
}
