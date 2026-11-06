import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { withImplied } from "@/lib/permissions";
import type { Permission } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import type { SessionContext } from "@/lib/session-types";

/** Platzhalter für Seed-Tests – keine echten Werte (Plan 0.2, AGENTS.md). */
export const seedEnv = {
  adminUsername: "admin",
  adminPassword: "Start-Passwort-123",
  radioChannel: "1234",
  radioPassword: "0000",
};

export async function createRank(data: Partial<Prisma.RankCreateInput> = {}) {
  return prisma.rank.create({
    data: {
      name: data.name ?? `Rang ${randomUUID().slice(0, 8)}`,
      level: data.level ?? 10,
      permissions: data.permissions ?? [],
    },
  });
}

export async function createUserWithEmployee(
  opts: {
    permissions?: Permission[];
    level?: number;
    role?: "admin" | "user";
    username?: string;
  } = {},
) {
  const isAdmin = opts.role === "admin";
  const username = opts.username ?? `user-${randomUUID().slice(0, 8)}`;

  const rank = await createRank({
    name: isAdmin ? "Admin" : `Rang ${randomUUID().slice(0, 8)}`,
    // Level ist unique (CHECK 1–100) – mehrere Ränge in einem Test brauchen eigene Levels.
    level: isAdmin ? 100 : (opts.level ?? 10 + (await prisma.rank.count())),
    permissions: opts.permissions ?? [],
    ...(isAdmin ? { isSystem: true } : {}),
  });

  const user = await prisma.user.create({
    data: {
      id: randomUUID(),
      name: username,
      email: `${username}@bennys.local`,
      username,
      role: opts.role ?? "user",
    },
  });

  const employee = await prisma.employee.create({
    data: {
      userId: user.id,
      rankId: rank.id,
      serviceNumber: (await prisma.employee.count()) + 1,
      mustChangePassword: false,
    },
  });

  return { user, employee, rank };
}

/** Integrationstest-Kontext – baut User, Rang und Employee und nutzt dieselbe RechteLogik wie `getSessionContext`. */
export async function makeCtx(
  opts: {
    permissions?: Permission[];
    level?: number;
    isAdmin?: boolean;
    username?: string;
  } = {},
): Promise<SessionContext> {
  const { user, employee, rank } = await createUserWithEmployee({
    permissions: opts.permissions,
    level: opts.level,
    role: opts.isAdmin ? "admin" : "user",
    username: opts.username,
  });

  return {
    userId: user.id,
    username: user.username!,
    name: user.name,
    image: user.image ?? null,
    isAdmin: user.role === "admin",
    employeeId: employee.id,
    mustChangePassword: employee.mustChangePassword,
    rank: {
      id: rank.id,
      name: rank.name,
      level: rank.level,
      color: rank.color,
      isSystem: rank.isSystem,
    },
    permissions: withImplied(rank.permissions),
  };
}

export async function createCustomer(name = "Test Kunde") {
  return prisma.customer.create({ data: { name } });
}
