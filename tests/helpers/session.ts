import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withImplied } from "@/lib/permissions";
import type { SessionContext } from "@/lib/session-types";

/**
 * Echtes Login und daraus ein Cookie-Header für `getSessionContext`.
 * So testen wir den Weg, den der Proxy im Browser tatsächlich geht.
 */
export async function signInHeaders(username: string, password: string): Promise<Headers> {
  const res = await auth.api.signInUsername({
    body: { username, password },
    returnHeaders: true,
  });

  if (!res) throw new Error("Anmeldung fehlgeschlagen");

  const setCookie = res.headers?.get("set-cookie");
  if (!setCookie) throw new Error("Kein Session-Cookie erhalten");

  const pair = setCookie.split(";")[0];
  if (!pair) throw new Error("Set-Cookie ohne Wert");

  const h = new Headers();
  h.set("cookie", pair);
  return h;
}

/** Kontext direkt aus der DB (für Skripte ohne Request-Scope, z. B. Playwright-Global-Setup). */
export async function ctxForUsername(username: string): Promise<SessionContext> {
  const user = await prisma.user.findFirstOrThrow({
    where: { username },
    include: { employee: { include: { rank: true } } },
  });
  const employee = user.employee!;

  return {
    userId: user.id,
    username: user.username!,
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
