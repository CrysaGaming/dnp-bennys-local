import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { assertPermission } from "@/lib/permissions";
import { CompanyStatusMode, LogoVariant } from "@/generated/prisma/enums";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import type { SessionContext } from "@/lib/session-types";
import { companySettingsSchema, type CompanySettingsInput } from "./schemas";

/** Der Singleton: die Firma hat genau eine Einstellungszeile (Spec 5.11). */
export const COMPANY_SETTINGS_ID = 1;

export type CompanySettings = {
  name: string;
  phone: string | null;
  radioChannel: string | null;
  radioPassword: string | null;
  statusMode: CompanyStatusMode;
  manualOpen: boolean;
  minOnDuty: number;
  logoVariant: LogoVariant;
};

type SettingsRow = CompanySettings & { id: number };

/** Ohne Seed (z. B. Test-DB) entsteht die Zeile beim ersten Lesen. */
async function readSettings(db: Prisma.TransactionClient | PrismaClient): Promise<SettingsRow> {
  return db.companySettings.upsert({
    where: { id: COMPANY_SETTINGS_ID },
    create: { id: COMPANY_SETTINGS_ID },
    update: {},
  });
}

function settingsOf(row: SettingsRow): CompanySettings {
  return {
    name: row.name,
    phone: row.phone,
    radioChannel: row.radioChannel,
    radioPassword: row.radioPassword,
    statusMode: row.statusMode,
    manualOpen: row.manualOpen,
    minOnDuty: row.minOnDuty,
    logoVariant: row.logoVariant,
  };
}

export async function getCompanySettings(): Promise<CompanySettings> {
  return settingsOf(await readSettings(prisma));
}

/** Leere Eingaben bedeuten „nicht hinterlegt“ → null (Spec 5.11). */
function toData(input: CompanySettingsInput) {
  return {
    name: input.name,
    phone: input.phone || null,
    radioChannel: input.radioChannel || null,
    radioPassword: input.radioPassword || null,
    statusMode: input.statusMode,
    manualOpen: input.manualOpen,
    minOnDuty: input.minOnDuty,
    logoVariant: input.logoVariant,
  };
}

export async function updateCompanySettings(
  ctx: SessionContext,
  input: unknown,
): Promise<CompanySettings> {
  const parsed = companySettingsSchema.parse(input);
  assertPermission(ctx, "COMPANY_MANAGE");

  return prisma.$transaction(async (tx) => {
    const before = settingsOf(await readSettings(tx));
    const after = settingsOf(
      await tx.companySettings.update({
        where: { id: COMPANY_SETTINGS_ID },
        data: toData(parsed),
      }),
    );

    await writeAudit(tx, {
      actorId: ctx.userId,
      action: "company.update",
      entity: "company_settings",
      entityId: String(COMPANY_SETTINGS_ID),
      data: { before, after },
    });

    return after;
  });
}
