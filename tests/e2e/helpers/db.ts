import "./test-env";

import { auth } from "@/lib/auth";
import { internalEmail } from "@/lib/auth-email";
import { prisma } from "@/lib/prisma";
import { resetDb } from "@tests/helpers/db";
import { createRank } from "@tests/helpers/factories";
import type { Permission } from "@/generated/prisma/enums";

export { prisma, resetDb };
export * from "@tests/helpers/factories";

/** User mit echtem Passwort plus Rang und Employee – für Login-Tests im Browser. */
export async function createLoginUser(
  username: string,
  password: string,
  opts: {
    mustChangePassword?: boolean;
    permissions?: Permission[];
    level?: number;
    /** Ohne Employee gibt es kein Mitarbeiterprofil – für die Meldung nach dem Login. */
    employee?: boolean;
  } = {},
) {
  const { user } = await auth.api.createUser({
    body: {
      email: internalEmail(username),
      password,
      name: username,
      data: { username },
    },
  });

  const rank =
    (await prisma.rank.findUnique({ where: { level: opts.level ?? 10 } })) ??
    (await createRank({ level: opts.level ?? 10, permissions: opts.permissions ?? [] }));

  if (opts.employee === false) {
    return { user: user!, employee: null, rank };
  }

  const employee = await prisma.employee.create({
    data: {
      userId: user!.id,
      rankId: rank.id,
      serviceNumber: (await prisma.employee.count()) + 1,
      mustChangePassword: opts.mustChangePassword ?? false,
    },
  });

  return { user: user!, employee, rank };
}
