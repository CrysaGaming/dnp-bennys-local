import "dotenv/config";
import { createPrismaClient } from "@/lib/prisma";

const url = process.env.DATABASE_URL_TEST;
if (!url) throw new Error("DATABASE_URL_TEST fehlt");

export const testPrisma = createPrismaClient(url);

/** Alle Tabellen leeren – läuft vor jedem Integrationstest (Plan 0.3). */
export async function resetDb(): Promise<void> {
  const tables = await testPrisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_catalog.pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;

  for (const { tablename } of tables) {
    await testPrisma.$executeRawUnsafe(
      `TRUNCATE TABLE "public"."${tablename}" RESTART IDENTITY CASCADE`,
    );
  }
}
