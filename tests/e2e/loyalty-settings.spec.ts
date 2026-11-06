import { expect, test } from "@playwright/test";
import { createRank, prisma } from "./helpers/db";
import { loginAs } from "./helpers/login";

const STORAGE_STATE = "tests/e2e/.auth/admin.json";

test.use({ storageState: STORAGE_STATE });

// Alle Tests hier schreiben dieselbe Singleton-Zeile – in einer Datei laufen sie der
// Reihe nach und nicht gegen einen anderen Spec.
test("PunkteModus zeigt Zahl und Balken", async ({ page }) => {
  await prisma.loyaltySettings.update({
    where: { id: 1 },
    data: { enabled: true, mode: "POINTS", dollarsPerPoint: 100 },
  });

  await prisma.loyaltyReward.create({
    data: { name: "Funf Dollar LSE2E", type: "FIXED_DISCOUNT", value: 5, cost: 50 },
  });

  const customer = await prisma.customer.create({ data: { name: "Punktekunde LSE2E", loyaltyBalance: 30 } });

  await page.goto(`/kunden/${customer.number}`);

  await expect(page.getByText("30 Punkte")).toBeVisible();
  await expect(page.getByText(/Noch 20 Punkte bis/)).toBeVisible();
  await expect(page.locator("[data-points-bar]")).toHaveAttribute("style", /width:s*60%/);;
});

test("Treuesystem einschalten", async ({ page }) => {
  // Seed-Standard: aus, Stempel, 1 pro Besuch, Mindestbetrag 500.
  await prisma.loyaltySettings.update({ where: { id: 1 }, data: { enabled: false, mode: "STAMPS" } });

  await page.goto("/kunden/treue-einstellungen");

  await expect(page.getByText("Das Treuesystem ist aus. Kunden sammeln gerade nichts.")).toBeVisible();
  await expect(page.getByText("Beispiel: Rechnung $1.200 → +1 Stempel")).toBeVisible();

  await page.getByRole("switch", { name: "Treuesystem aktiv" }).click();
  await page.getByRole("button", { name: "Änderungen speichern" }).click();

  await expect(page.getByText("Das Treuesystem ist aus.")).toHaveCount(0);
  await expect(page.getByText("Das Treuesystem ist an.")).toBeVisible();
});

test("Moduswechsel ist gesperrt, wenn ein Kunde Guthaben hat", async ({ page }) => {
  await prisma.customer.create({ data: { name: "Guthaben E2E", loyaltyBalance: 1 } });

  await page.goto("/kunden/treue-einstellungen");

  await expect(
    page.getByText("Modus kann nur gewechselt werden, solange kein Kunde Guthaben hat."),
  ).toBeVisible();

  const punkte = page.getByRole("radio", { name: "Punkte" });
  await expect(punkte).toHaveAttribute("aria-disabled", "true");

  await expect(page.getByRole("radio", { name: "Stempel" })).toHaveAttribute("aria-checked", "true");
});

test("Prämie mit Gratis-Leistung anlegen", async ({ page }) => {
  const category = await prisma.priceCategory.create({ data: { name: "E2E Kat" } });
  const item = await prisma.priceListItem.create({
    data: { name: "Ölwechsel LSE2E", price: 250, categoryId: category.id },
  });

  await page.goto("/kunden/praemien");

  await page.getByRole("textbox", { name: "Prämienname" }).fill("Gratis Wäsche LSE2E");
  await page.getByRole("combobox", { name: "Art" }).click();
  await page.getByRole("option", { name: "Gratis-Leistung" }).click();
  await page.getByRole("combobox", { name: "Leistung" }).click();
  await page.getByRole("option", { name: new RegExp(item.name) }).click();
  await page.getByRole("spinbutton", { name: "Kosten" }).fill("5");
  await page.getByRole("button", { name: "Speichern" }).click();

  const row = page.getByRole("row", { name: /Gratis Wäsche LSE2E/ });
  await expect(row).toContainText("5");
  await expect(row).toContainText("Ölwechsel LSE2E");
});

test("ohne LOYALTY_MANAGE ist alles schreibgeschützt", async ({ page, browser }) => {
  const rankName = "Treue Leser E2E";
  const username = "e2etreueleser";

  await createRank({ name: rankName, level: 30, permissions: ["CUSTOMERS_VIEW"] });

  await page.goto("/mitarbeiter/neu");
  await page.getByRole("textbox", { name: "IC-Name" }).fill("Treue Leser");
  await page.getByRole("textbox", { name: "Benutzername" }).fill(username);
  await page.getByRole("combobox", { name: "Rang" }).click();
  await page.getByRole("option", { name: new RegExp(rankName) }).click();
  await page.getByRole("spinbutton", { name: "Dienstnummer" }).fill(
    String((await prisma.employee.count()) + 80),
  );
  await page.getByRole("button", { name: "Speichern" }).click();

  const password = (await page.getByTestId("start-password").innerText()).trim();

  // Eigener Context, damit die Admin-Session nicht mitläuft.
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

  // Erst etwas Positives prüfen – sonst gewinnt ein Count-0, weil die Seite noch nicht da ist.
  await reader.goto("/kunden/treue-einstellungen");
  await expect(reader.getByRole("heading", { name: "Treue-Einstellungen" })).toBeVisible();
  await expect(reader.getByRole("button", { name: "Änderungen speichern" })).toHaveCount(0);

  await reader.goto("/kunden/praemien");
  await expect(reader.getByRole("heading", { name: "Treueprämien" })).toBeVisible();
  await expect(reader.getByRole("button", { name: "Speichern" })).toHaveCount(0);

  await context.close();
});
