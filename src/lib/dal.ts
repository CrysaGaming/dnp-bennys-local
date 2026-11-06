import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, withImplied } from "@/lib/permissions";
import type { Permission } from "@/generated/prisma/enums";
import type { SessionContext } from "./session-types";
import type { LoginState } from "./login-notice";

type UserLike = {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
  role: string | null;
  banned: boolean | null;
};

type EmployeeLike = {
  id: string;
  userId: string;
  mustChangePassword: boolean;
  status: string;
  rank: {
    id: string;
    name: string;
    level: number;
    color: string;
    isSystem: boolean;
    permissions: Permission[];
  };
};

function toContext(user: UserLike, employee: EmployeeLike): SessionContext {
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

/**
 * Der eigentliche Blick auf den Zugriff (Spec 3.2). User und Employee werden immer frisch
 * aus der DB geladen: mit `cookieCache` (5 min) würde `getSession` sonst einen veralteten
 * Stand für gerade gesperrte oder gekündigte Mitarbeiter liefern.
 *
 * `no_profile` ist der Fall, in dem Besser Auth die Session kennt, aber keine Mitarbeiterkarte
 * dahintersteht – gesperrt, gekündigt oder nie angelegt. Das ist kein Login-Fehler, sondern
 * ein Grund, der genannt werden muss.
 */
export async function getLoginState(h: Headers): Promise<LoginState> {
  const session = await auth.api.getSession({ headers: h });
  if (!session?.user) return { kind: "none" };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { kind: "none" };

  if (user.banned) {
    return { kind: "no_profile", username: user.username ?? "", reason: "banned" };
  }

  const employee = await prisma.employee.findUnique({
    where: { userId: user.id },
    include: { rank: true },
  });

  if (!employee) {
    return { kind: "no_profile", username: user.username ?? "", reason: "missing" };
  }

  if (employee.status !== "ACTIVE") {
    return { kind: "no_profile", username: user.username ?? "", reason: "terminated" };
  }

  return { kind: "context", ctx: toContext(user, employee) };
}

/** Sicherheitsgrenze: nur ein vollständiger Kontext gilt. */
export async function getSessionContext(h: Headers): Promise<SessionContext | null> {
  const state = await getLoginState(h);
  return state.kind === "context" ? state.ctx : null;
}

/** Pro Request genau einmal geladen (React `cache`). */
const loadContext = cache(async (): Promise<SessionContext | null> =>
  getSessionContext(await headers()),
);

/** Startroute für einen Mitarbeiter: erst das neue Passwort, dann das Dashboard. */
export function startRoute(ctx: SessionContext): string {
  return ctx.mustChangePassword ? "/settings?pw=1" : "/dashboard";
}

/** Für die Shell: Theme und Bewegung kommen aus der Session, ohne umzuleiten. */
export async function optionalSession(): Promise<SessionContext | null> {
  return loadContext();
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
