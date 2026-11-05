import "dotenv/config";
import { PrismaClient } from "@/generated/prisma/client";
import { Permission } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { createPrismaClient } from "@/lib/prisma";
import { internalEmail } from "@/lib/auth-email";

export type SeedEnv = {
  adminUsername?: string;
  adminPassword?: string;
  radioChannel?: string;
  radioPassword?: string;
};

const ADMIN_RANK_COLOR = "#FF2E88"; // Sunset Pink (Spec 4.2)
const PRICE_CATEGORIES = ["Reparatur", "Motor", "Fahrwerk", "Optik", "Lackierung", "Abschleppen"];

/** Idempotent – darf bei jedem Container-Start laufen (Spec 7.6 / 13.2). */
export async function seed(db: PrismaClient, env: SeedEnv): Promise<void> {
  // 1. Firmeneinstellungen: nur beim ersten Lauf anlegen, spätere Änderungen bleiben.
  await db.companySettings.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      name: "Benny's",
      logoVariant: "VICE_CITY",
      radioChannel: env.radioChannel ?? null,
      radioPassword: env.radioPassword ?? null,
    },
    update: {},
  });

  // 2. Admin-Rang: Rechte bei jedem Lauf vollständig setzen.
  const permissions = Object.values(Permission);
  const adminRank = await db.rank.upsert({
    where: { level: 100 },
    create: { name: "Admin", level: 100, isSystem: true, color: ADMIN_RANK_COLOR, permissions },
    update: { permissions },
  });

  // 3. Preiskategorien.
  for (const [index, name] of PRICE_CATEGORIES.entries()) {
    await db.priceCategory.upsert({
      where: { name },
      create: { name, sortOrder: index },
      update: {},
    });
  }

  // 4. Treue-Einstellungen: aus, mit den Vorschlagswerten aus Spec 3.6. Keine Prämien.
  await db.loyaltySettings.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });

  // 5. Erst-Admin.
  if (!env.adminUsername || !env.adminPassword) {
    console.warn("Seed: SEED_ADMIN_USERNAME und SEED_ADMIN_PASSWORD fehlen – kein Admin-User angelegt.");
    return;
  }

  const username = env.adminUsername;
  const existing = await db.user.findUnique({ where: { username } });
  if (existing) return;

  const created = await auth.api.createUser({
    body: {
      email: internalEmail(username),
      password: env.adminPassword,
      name: "Admin",
      role: "admin",
      data: { username },
    },
  });

  await db.employee.create({
    data: {
      userId: created.user.id,
      rankId: adminRank.id,
      serviceNumber: 1,
      mustChangePassword: true,
    },
  });
}

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL fehlt");

  const db = createPrismaClient(url);
  await seed(db, {
    adminUsername: process.env.SEED_ADMIN_USERNAME,
    adminPassword: process.env.SEED_ADMIN_PASSWORD,
    radioChannel: process.env.SEED_RADIO_CHANNEL,
    radioPassword: process.env.SEED_RADIO_PASSWORD,
  });
  await db.$disconnect();
}

const entry = process.argv[1] ?? "";
if (entry.endsWith("seed.ts") || entry.endsWith("seed.mjs")) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
