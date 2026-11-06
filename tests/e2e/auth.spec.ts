import { expect, test } from "@playwright/test";
import { E2E_ADMIN_PASSWORD } from "./global-setup";
import { loginAs, startScene } from "./helpers/login";
import { createLoginUser, prisma } from "./helpers/db";

// Die DB wird einmal in global-setup geleert und geseedet – pro Test nur neue
// Benutzer anlegen, sonst wären die Seed-Daten und die Admin-Session (Storage-State
// für die anderen Specs) weg.

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

test("Logout führt zu /login", async ({ page }) => {
  // Eigene Session über das Formular: das Sign-Out widerruft sie in der DB. Über den
  // Storage-State wäre die gemeinsame Admin-Session danach tot und alle späteren Tests
  // landen auf /login – je nachdem, welcher Worker welches File zuerst läuft.
  await loginAs(page, "admin", E2E_ADMIN_PASSWORD);
  await expect(page).toHaveURL(/\/dashboard$/);

  // Das User-Menü im Header aufmachen (Spec 5.2), dann Logout.
  await page.getByRole("button", { name: /Admin/ }).click();
  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test("veraltetes Cookie erzeugt keine Schleife", async ({ page, context }) => {
  // Review Focus 3: der Proxy leitet nie von /login weg.
  await context.addCookies([
    { name: "better-auth.session_token", value: "ungueltig", url: "http://localhost:3100" },
  ]);

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);

  // Das Intro (Phase 3) ist der erste Schirm – danach steht das Formular.
  await startScene(page);
});
