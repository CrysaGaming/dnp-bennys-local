import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import "./helpers/test-env";

import { auth } from "@/lib/auth";
import { completePasswordChange } from "@/features/account/service";
import { seed } from "../../prisma/seed";
import { prisma, resetDb, seedEnv } from "./helpers/db";
import { ctxForUsername } from "@tests/helpers/session";

export const E2E_ADMIN_PASSWORD = "E2E-Passwort-456";

/** Aus dem Set-Cookie-Wert einen Cookie-Header bauen (better-auth liest `cookie`). */
function cookieHeader(setCookie: string): Headers {
  const pair = setCookie.split(";")[0] ?? "";
  const h = new Headers();
  h.set("cookie", pair);
  return h;
}

function storageState(setCookie: string): unknown {
  const [pair, ...rest] = setCookie.split(";");
  const [name, value] = (pair ?? "").split("=");

  return {
    cookies: [
      {
        name,
        value,
        domain: "localhost",
        path: "/",
        // Playwright will für den Storage-State eine Zahl; -1 heißt „Session-Cookie“.
        expires: -1,
        httpOnly: rest.some((s) => s.trim().toLowerCase() === "httponly"),
        secure: rest.some((s) => s.trim().toLowerCase() === "secure"),
        sameSite: "Lax",
      },
    ],
    origins: [],
  };
}

/**
 * Test-DB migrieren und leeren, seeden, admin einloggen, Passwort ändern und die
 * Session als Storage-State für die E2E-Tests ablegen.
 */
export default async function globalSetup(): Promise<void> {
  execSync("node scripts/with-test-db.mjs \"npx prisma migrate deploy\"", { stdio: "inherit" });

  await resetDb();
  await seed(prisma, seedEnv);

  const signIn = await auth.api.signInUsername({
    body: { username: seedEnv.adminUsername!, password: seedEnv.adminPassword! },
    returnHeaders: true,
  });

  const setCookie = signIn?.headers?.get("set-cookie");
  if (!setCookie) throw new Error("E2E-Login: kein Session-Cookie erhalten");

  const headers = cookieHeader(setCookie);

  await auth.api.changePassword({
    body: { currentPassword: seedEnv.adminPassword!, newPassword: E2E_ADMIN_PASSWORD },
    headers,
  });

  await completePasswordChange(await ctxForUsername(seedEnv.adminUsername!));

  mkdirSync("tests/e2e/.auth", { recursive: true });
  writeFileSync("tests/e2e/.auth/admin.json", JSON.stringify(storageState(setCookie), null, 2));

  await prisma.$disconnect();
}
