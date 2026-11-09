import { expect, test } from "@playwright/test";
import { createRank, prisma } from "./helpers/db";
import { loginAs } from "./helpers/login";

const STORAGE_STATE = "tests/e2e/.auth/admin.json";

test.use({ storageState: STORAGE_STATE });

test("knappe Teile und zu große Abbuchung", async ({ page }) => {
  // Die Specs teilen sich eine DB – Name pro Spec eindeutig.
  const name = "Bremsscheibe E2E";

  await page.goto("/lager");

  await page.getByRole("button", { name: "Neues Teil" }).click();
  await page.getByRole("textbox", { name: "Teilname" }).fill(name);
  await page.getByRole("textbox", { name: "Artikelnummer" }).fill("BR-E2E");
  await page.getByRole("spinbutton", { name: "Mindestbestand" }).fill("5");
  await page.getByRole("spinbutton", { name: "EK-Preis" }).fill("80");
  await page.getByRole("button", { name: "Speichern" }).click();

  const row = page.getByRole("row", { name: new RegExp(name) });
  await expect(row).toContainText("knapp");

  // Wareneingang 3: der Bestand bleibt unter dem Mindestbestand, die Zeile bleibt knapp.
  await row.getByRole("button", { name: "Buchen" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("combobox", { name: "Art" }).click();
  await page.getByRole("option", { name: "Wareneingang" }).click();
  await dialog.getByRole("spinbutton", { name: "Menge" }).fill("3");
  await dialog.getByRole("button", { name: "Buchen" }).click();

  await expect(row).toContainText("3");

  // Verlust 10 auf Bestand 3 – das bedingte Update bekommt keine Zeile.
  await row.getByRole("button", { name: "Buchen" }).click();
  await page.getByRole("combobox", { name: "Art" }).click();
  await page.getByRole("option", { name: "Verlust" }).click();
  await dialog.getByRole("spinbutton", { name: "Menge" }).fill("10");
  await dialog.getByRole("textbox", { name: "Notiz" }).fill("Zu viel");
  await dialog.getByRole("button", { name: "Buchen" }).click();

  await expect(page.getByText("Nicht genug auf Lager.")).toBeVisible();

  // Dasselbe in kleiner Menge geht.
  await dialog.getByRole("spinbutton", { name: "Menge" }).fill("1");
  await dialog.getByRole("textbox", { name: "Notiz" }).fill("Diebstahl E2E");
  await dialog.getByRole("button", { name: "Buchen" }).click();

  await expect(row).toContainText("2");
  // Historie.
  await row.getByRole("button", { name: "Historie" }).click();
  await expect(page.getByText("+3 Stk Wareneingang")).toBeVisible();
  await expect(page.getByText("-1 Stk Verlust")).toBeVisible();
  await expect(page.getByText("Diebstahl E2E")).toBeVisible();
});

test("ohne INVENTORY_MANAGE gibt es keine Knöpfe zum Buchen", async ({ page, browser }) => {
  const rankName = "Lager Leser E2E";
  const username = "e2eviewer";

  await createRank({ name: rankName, level: 25, permissions: ["INVENTORY_VIEW"] });

  await page.goto("/mitarbeiter/neu");
  await page.getByRole("textbox", { name: "IC-Name" }).fill("Lager Leser");
  await page.getByRole("textbox", { name: "Benutzername" }).fill(username);
  await page.getByRole("combobox", { name: "Rang" }).click();
  await page.getByRole("option", { name: new RegExp(rankName) }).click();
  await page.getByRole("spinbutton", { name: "Dienstnummer" }).fill(
    String((await prisma.employee.count()) + 60),
  );
  await page.getByRole("button", { name: "Speichern" }).click();

  const password = (await page.getByTestId("start-password").innerText()).trim();

  // eigener Context, damit die Admin-Session nicht mitläuft
  const context = await browser.newContext({ storageState: undefined });
  const viewer = await context.newPage();

  await viewer.goto("/login");
  await loginAs(viewer, username, password);
  await expect(viewer).toHaveURL(/\/settings\?pw=1$/);

  await viewer.getByRole("textbox", { name: "Aktuelles Passwort" }).fill(password);
  await viewer.getByRole("textbox", { name: "Neues Passwort", exact: true }).fill("Neues-Passwort-123");
  await viewer.getByRole("textbox", { name: "Neues Passwort bestätigen" }).fill("Neues-Passwort-123");
  await viewer.getByRole("button", { name: "Passwort ändern" }).click();

  // Auf die Umbiegung nach /dashboard warten – sonst läuft die nächste Navigation der
  // clientseitigen Umbiegung voraus und landet zurück auf /settings?pw=1.
  await expect(viewer).toHaveURL(/\/dashboard$/);

  await viewer.goto("/lager");

  // Erst etwas Positives prüfen – sonst gewinnt ein Count-0-Test, weil die Seite noch
  // gar nicht gerendert ist.
  await expect(viewer.getByRole("heading", { name: "Lager" })).toBeVisible();
  await expect(viewer.getByRole("button", { name: "Historie" }).first()).toBeVisible();

  await expect(viewer.getByRole("button", { name: "Buchen" })).toHaveCount(0);
  await expect(viewer.getByRole("button", { name: "Neues Teil" })).toHaveCount(0);

  await context.close();
});
