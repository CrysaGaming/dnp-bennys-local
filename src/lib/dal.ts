import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, withImplied } from "@/lib/permissions";
import type { Permission } from "@/generated/prisma/enums";
import type { SessionContext } from "./session-types";

/**
 * Die eigentliche Sicherheitsgrenze (Spec 3.2).
 * User und Employee werden immer frisch aus der DB geladen: mit `cookieCache`
 * (5 min) würde `getSession` sonst einen veralteten Stand für gerade gesperrte
 * oder gekündigte Mitarbeiter liefern.
 */
export async function getSessionContext(h: Headers): Promise<SessionContext | null> {
  const session = await auth.api.getSession({ headers: h });
  if (!session?.user) return null;

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.banned) return null;

  const employee = await prisma.employee.findUnique({
    where: { userId: user.id },
    include: { rank: true },
  });
  if (!employee || employee.status !== "ACTIVE") return null;

  return {
    userId: user.id,
    username: user.username ?? "",
    name: user.name,
    image: user.image ?? null,
    isAdmin: user.role === "admin",
    employeeId: employee.id,
    mustChangePassword: employee.mustChangePassword,
    rank: {
      id: employee.rank.id,
      name: employee.rank.name,
      level: employee.rank.level,
      color: employee.rank.color,
      isSystem: employee.rank.isSystem,
    },
    permissions: withImplied(employee.rank.permissions),
  };
}

/** Pro Request genau einmal geladen (React `cache`). */
const loadContext = cache(async (): Promise<SessionContext | null> =>
  getSessionContext(await headers()),
);

/** Startroute für einen Mitarbeiter: erst das neue Passwort, dann das Dashboard. */
export function startRoute(ctx: SessionContext): string {
  return ctx.mustChangePassword ? "/settings?pw=1" : "/dashboard";
}

export async function requireSession(opts: { allowMustChangePassword?: boolean } = {}): Promise<SessionContext> {
  const ctx = await loadContext();

  if (!ctx) redirect("/login");
  if (ctx.mustChangePassword && !opts.allowMustChangePassword) redirect(startRoute(ctx));

  return ctx;
}

export async function requirePagePermission(p: Permission): Promise<SessionContext> {
  const ctx = await requireSession();
  if (!hasPermission(ctx, p)) redirect("/dashboard?fehler=berechtigung");
  return ctx;
}
