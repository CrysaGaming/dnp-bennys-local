import { expect, test } from "@playwright/test";
import { createRank as makeRank, prisma } from "./helpers/db";
import { loginAs } from "./helpers/login";

const STORAGE_STATE = "tests/e2e/.auth/admin.json";

test.use({ storageState: STORAGE_STATE });

/**
 * Chef legt Rang und Mitarbeiter an (Spec 5.6 und 3.5). Der Rang kommt per Factory –
 * geklickt wird nur der Weg, den ein Mitarbeiter im Browser geht. Der Mitarbeiter selbst
 * bekommt einen eigenen Context, damit die Admin-Session nicht mitläuft.
 */
test("Chef legt Mitarbeiter an, der Mitarbeiter sieht nur Erlaubtes", async ({ page, browser }) => {
  // Die E2E-Specs teilen sich eine DB (Reset nur im Global-Setup) – Namen und Nummer
  // müssen pro Spec eindeutig sein.
  const rankName = "Mechaniker E2E";
  const username = "e2emax";
  const serviceNumber = (await prisma.employee.count()) + 50;
  await makeRank({ name: rankName, level: 21, permissions: ["RESOURCES_VIEW"] });

  await page.goto("/mitarbeiter/neu");

  await page.getByRole("textbox", { name: "IC-Name" }).fill("Max Power");
  await page.getByRole("textbox", { name: "Benutzername" }).fill(username);
  await page.getByRole("combobox", { name: "Rang" }).click();
  await page.getByRole("option", { name: new RegExp(rankName) }).click();
  await page.getByRole("spinbutton", { name: "Dienstnummer" }).fill(String(serviceNumber));
  await page.getByRole("button", { name: "Speichern" }).click();

  const password = (await page.getByTestId("start-password").innerText()).trim();
  expect(password).toMatch(/^[A-Za-z0-9]{14}$/);

  // Der neue Context braucht keine Admin-Session – sonst gilt der Login als schon da und
  // /login leitet aufs Dashboard.
  const context = await browser.newContext({ storageState: undefined });
  const employeePage = await context.newPage();

  await employeePage.goto("/login");
  await loginAs(employeePage, username, password);

  await expect(employeePage).toHaveURL(/\/settings\?pw=1$/);

  await employeePage.getByRole("textbox", { name: "Aktuelles Passwort" }).fill(password);
  await employeePage.getByRole("textbox", { name: "Neues Passwort", exact: true }).fill("Neues-Passwort-123");
  await employeePage.getByRole("textbox", { name: "Neues Passwort bestätigen" }).fill("Neues-Passwort-123");
  await employeePage.getByRole("button", { name: "Passwort ändern" }).click();

  await expect(employeePage).toHaveURL(/\/dashboard$/);

  // Was der Rang erlaubt: Kunden Ansehen fehlt, Ressourcen ist da, Verwaltung nicht.
  // Die Gruppen sind über data-slot eindeutig – „Übersicht“ steht sonst auch im Breadcrumb.
  const groups = employeePage.locator('[data-slot="sidebar-group-label"]');

  for (const group of ["Übersicht", "Kunden", "Betrieb", "Ressourcen", "Team"]) {
    await expect(groups.filter({ hasText: group }).first()).toBeVisible();
  }

  await expect(groups.filter({ hasText: "Verwaltung" })).toHaveCount(0);

  await employeePage.goto("/raenge");
  await expect(employeePage).toHaveURL(/fehler=berechtigung/);
  await expect(employeePage.getByText("Dafür fehlt dir die Berechtigung.")).toBeVisible();

  await context.close();
});
