import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { ThemePreference } from "@/generated/prisma/enums";

import type { SessionContext } from "@/lib/session-types";
import { avatarSchema, musicPreferenceSchema, preferencesSchema, profileSchema } from "./schemas";

/**
 * Nach dem eigentlichen Passwortwechsel über Better Auth (Spec 3.2):
 * das Zwangs-Flag erledigen und auditieren.
 */
export async function completePasswordChange(ctx: SessionContext): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.employee.update({
      where: { id: ctx.employeeId },
      data: { mustChangePassword: false },
    });

    await writeAudit(tx, {
      actorId: ctx.userId,
      action: "account.password_changed",
      entity: "employee",
      entityId: ctx.employeeId,
    });
  });
}

export type Profile = { name: string; phone: string | null };
export type Preferences = { theme: ThemePreference; reducedMotion: boolean };
export type MusicPreference = { dashboardMusic: boolean; musicVolume: number };

/** Standard ohne Zeile: aus, 35 % (Spec 6.4). */
const DEFAULT_MUSIC: MusicPreference = { dashboardMusic: false, musicVolume: 35 };

/** Jemand sieht nur sein eigenes Profil – ein Recht ist dafür nicht nötig (Spec 5.12). */
export async function getProfile(ctx: SessionContext): Promise<Profile> {
  const employee = await prisma.employee.findUniqueOrThrow({ where: { id: ctx.employeeId } });
  const user = await prisma.user.findUniqueOrThrow({ where: { id: ctx.userId } });

  return { name: user.name, phone: employee.phone };
}

//** Lesen ohne Schreiben – die Seite soll bei jedem Aufruf nichts ändern. */
export async function getPreferences(ctx: SessionContext): Promise<Preferences> {
  const row = await prisma.userPreference.findUnique({ where: { userId: ctx.userId } });

  return {
    theme: row?.theme ?? ThemePreference.SYSTEM,
    reducedMotion: row?.reducedMotion ?? false,
  };
}

export async function updateProfile(ctx: SessionContext, input: unknown): Promise<Profile> {
  const data = profileSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.update({ where: { id: ctx.userId }, data: { name: data.name } });
    const employee = await tx.employee.update({
      where: { id: ctx.employeeId },
      data: { phone: data.phone ?? null },
    });

    await writeAudit(tx, {
      actorId: ctx.userId,
      action: "account.profile_updated",
      entity: "employee",
      entityId: ctx.employeeId,
      data: { name: user.name, phone: employee.phone },
    });

    return { name: user.name, phone: employee.phone };
  });
}

/** `url` ist die Adresse aus `saveAvatar` (Spec 8), `null` nimmt den Avatar weg. */
export async function setAvatar(ctx: SessionContext, url: string | null): Promise<string | null> {
  const data = avatarSchema.parse({ url });

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: ctx.userId }, data: { image: data.url ?? null } });

    await writeAudit(tx, {
      actorId: ctx.userId,
      action: "account.avatar_updated",
      entity: "user",
      entityId: ctx.userId,
      data: { url: data.url ?? null },
    });
  });

  return data.url ?? null;
}

export async function updatePreferences(
  ctx: SessionContext,
  input: unknown,
): Promise<Preferences> {
  const data = preferencesSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const row = await tx.userPreference.upsert({
      where: { userId: ctx.userId },
      create: { userId: ctx.userId, theme: data.theme, reducedMotion: data.reducedMotion },
      update: { theme: data.theme, reducedMotion: data.reducedMotion },
    });

    await writeAudit(tx, {
      actorId: ctx.userId,
      action: "account.preferences_updated",
      entity: "user_preference",
      entityId: ctx.userId,
      data: { theme: data.theme, reducedMotion: data.reducedMotion },
    });

    return { theme: row.theme, reducedMotion: row.reducedMotion };
  });
}

/** Die Musik-Einstellung gilt pro User (Spec 6.4). Lesen ohne Schreiben. */
export async function getMusicPreference(ctx: SessionContext): Promise<MusicPreference> {
  const row = await prisma.userPreference.findUnique({ where: { userId: ctx.userId } });

  return row
    ? { dashboardMusic: row.dashboardMusic, musicVolume: row.musicVolume }
    : DEFAULT_MUSIC;
}

export async function setMusicPreference(
  ctx: SessionContext,
  input: unknown,
): Promise<MusicPreference> {
  const data = musicPreferenceSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const row = await tx.userPreference.upsert({
      where: { userId: ctx.userId },
      create: { userId: ctx.userId, dashboardMusic: data.dashboardMusic, musicVolume: data.musicVolume },
      update: { dashboardMusic: data.dashboardMusic, musicVolume: data.musicVolume },
    });

    await writeAudit(tx, {
      actorId: ctx.userId,
      action: "account.music_updated",
      entity: "user_preference",
      entityId: ctx.userId,
      data: { dashboardMusic: data.dashboardMusic, musicVolume: data.musicVolume },
    });

    return { dashboardMusic: row.dashboardMusic, musicVolume: row.musicVolume };
  });
}
