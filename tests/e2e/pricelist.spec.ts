import { expect, test } from "@playwright/test";
import { createRank, prisma } from "./helpers/db";
import { loginAs } from "./helpers/login";

const STORAGE_STATE = "tests/e2e/.auth/admin.json";

test.use({ storageState: STORAGE_STATE });

test("Leistung anlegen, deaktivieren und wieder zeigen", async ({ page }) => {
  // Die Specs teilen sich eine DB – Namen pro Spec eindeutig.
  const categoryName = "Reparatur E2E";
  const itemName = "Ölwechsel E2E";

  await page.goto("/preisliste");

  await page.getByRole("textbox", { name: "Kategoriename" }).fill(categoryName);
  await page.getByRole("spinbutton", { name: "Sortierung" }).fill("3");
  await page.getByRole("button", { name: "Kategorie anlegen" }).click();

  await page.getByRole("textbox", { name: "Leistungsname" }).fill(itemName);
  await page.getByRole("textbox", { name: "Beschreibung" }).fill("Öl und Filter");
  await page.getByRole("spinbutton", { name: "Preis" }).fill("250");
  await page.getByRole("combobox", { name: "Kategorie" }).click();
  await page.getByRole("option", { name: new RegExp(categoryName) }).click();
  await page.getByRole("button", { name: "Speichern" }).click();

  const row = page.getByRole("row", { name: new RegExp(itemName) });
  await expect(row).toContainText("$250");
  await expect(row).toContainText("Öl und Filter");

  // Deaktivieren – ohne Schalter ist die Leistung aus der Liste raus.
  await row.getByRole("button", { name: "Deaktivieren" }).click();
  await expect(row).toHaveCount(0);

  await page.getByRole("checkbox", { name: "Inaktive zeigen" }).check();
  await expect(page.getByRole("row", { name: new RegExp(itemName) })).toContainText("inaktiv");

  // Wieder aktivieren.
  await page.getByRole("row", { name: new RegExp(itemName) }).getByRole("button", { name: "Aktivieren" }).click();
  await expect(page.getByRole("row", { name: new RegExp(itemName) })).toContainText("$250");
});

test("ohne Recht kann man nur lesen", async ({ page, browser }) => {
  const rankName = "Preis Leser E2E";
  const username = "e2eprisleser";

  await createRank({ name: rankName, level: 26, permissions: [] });

  await page.goto("/mitarbeiter/neu");
  await page.getByRole("textbox", { name: "IC-Name" }).fill("Preis Leser");
  await page.getByRole("textbox", { name: "Benutzername" }).fill(username);
  await page.getByRole("combobox", { name: "Rang" }).click();
  await page.getByRole("option", { name: new RegExp(rankName) }).click();
  await page.getByRole("spinbutton", { name: "Dienstnummer" }).fill(
    String((await prisma.employee.count()) + 70),
  );
  await page.getByRole("button", { name: "Speichern" }).click();

  const password = (await page.getByTestId("start-password").innerText()).trim();

  const context = await browser.newContext({ storageState: undefined });
  const reader = await context.newPage();

  await reader.goto("/login");
  await loginAs(reader, username, password);
  await expect(reader).toHaveURL(/\/settings\?pw=1$/);

  await reader.getByRole("textbox", { name: "Aktuelles Passwort" }).fill(password);
  await reader.getByRole("textbox", { name: "Neues Passwort", exact: true }).fill("Neues-Passwort-123");
  await reader.getByRole("textbox", { name: "Neues Passwort bestätigen" }).fill("Neues-Passwort-123");
  await reader.getByRole("button", { name: "Passwort ändern" }).click();

  await expect(reader).toHaveURL(/\/dashboard$/);

  await reader.goto("/preisliste");

  // Erst etwas Positives prüfen – sonst gewinnt ein Count-0-Test, weil die Seite noch
  // gar nicht gerendert ist.
  await expect(reader.getByRole("heading", { name: "Preisliste" })).toBeVisible();
  await expect(reader.getByRole("checkbox", { name: "Inaktive zeigen" })).toBeVisible();

  // Lesen ist für alle, die Knöpfe zum Schreiben bleiben weg.
  await expect(reader.getByRole("button", { name: "Kategorie anlegen" })).toHaveCount(0);
  await expect(reader.getByRole("button", { name: "Speichern" })).toHaveCount(0);
  await expect(reader.getByRole("button", { name: "Deaktivieren" })).toHaveCount(0);

  await context.close();
});
