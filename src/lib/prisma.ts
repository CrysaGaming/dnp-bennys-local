import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/** Client-Fabrik – Tests bauen einen eigenen Client pro Lauf. */
export function createPrismaClient(connectionString: string): PrismaClient {
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

function activeUrl(): string {
  const testUrl = process.env.DATABASE_URL_TEST;
  const inTestRuntime = process.env.VITEST === "true" || process.env.TEST === "true";
  const url = inTestRuntime && testUrl ? testUrl : process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL fehlt");
  return url;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient(activeUrl());

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
