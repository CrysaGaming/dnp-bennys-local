import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/login";
import { createLoginUser, prisma } from "./helpers/db";

// Die DB wird einmal in global-setup geleert und geseedet – pro Test nur neue
// Benutzer anlegen, sonst wäre die Admin-Session (Storage-State) weg.
const STORAGE_STATE = "tests/e2e/.auth/admin.json";

test("ohne Session auf /login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
});

test("falsches Passwort zeigt Fehler", async ({ page }) => {
  await createLoginUser("max", "Sicher-Passwort-1");

  await loginAs(page, "max", "falsch-falsch");
  await expect(page.getByText("Benutzername oder Passwort falsch.")).toBeVisible();
});

test("gesperrter User kommt nicht rein", async ({ page }) => {
  const { user } = await createLoginUser("tom", "Sicher-Passwort-1");
  await prisma.user.update({ where: { id: user.id }, data: { banned: true } });

  await loginAs(page, "tom", "Sicher-Passwort-1");
  await expect(page.getByText("Dein Zugang ist gesperrt.")).toBeVisible();
});

test("erzwingt Passwortwechsel beim ersten Login", async ({ page }) => {
  const { employee } = await createLoginUser("neu", "Start-Passwort-123", {
    mustChangePassword: true,
  });

  await loginAs(page, "neu", "Start-Passwort-123");
  await expect(page).toHaveURL(/\/settings\?pw=1$/);
  await expect(page.getByText("Bitte vergib ein neues Passwort.")).toBeVisible();

  await page.getByLabel("Aktuelles Passwort").fill("Start-Passwort-123");
  await page.getByLabel("Neues Passwort", { exact: true }).fill("Neues-Passwort-123");
  await page.getByLabel("Neues Passwort bestätigen").fill("Neues-Passwort-123");
  await page.getByRole("button", { name: "Passwort ändern" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(prisma.employee.findUniqueOrThrow({ where: { id: employee.id } })).resolves.toMatchObject({
    mustChangePassword: false,
  });
});

test.describe("mit Admin-Session", () => {
  test.use({ storageState: STORAGE_STATE });

  test("Logout führt zu /login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "Logout" }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
});

test("veraltetes Cookie erzeugt keine Schleife", async ({ page, context }) => {
  // Review Focus 3: der Proxy leitet nie von /login weg.
  await context.addCookies([
    { name: "better-auth.session_token", value: "ungueltig", url: "http://localhost:3100" },
  ]);

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("button", { name: "Einloggen" })).toBeVisible();
});
