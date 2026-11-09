import { expect, test } from "@playwright/test";
import { prisma } from "./helpers/db";

const STORAGE_STATE = "tests/e2e/.auth/admin.json";

test.use({ storageState: STORAGE_STATE });

/** Die Specs teilen sich eine DB – Namen und Kennzeichen pro Spec eindeutig. */
test("Kunde mit zwei Fahrzeugen anlegen und per Kennzeichen finden", async ({ page }) => {
  await page.goto("/kunden/neu");

  await page.getByRole("textbox", { name: "Name" }).fill("Carlos Ramirez E2E");
  await page.getByRole("textbox", { name: "Rufnummer" }).fill("555-0123");

  await page.getByRole("textbox", { name: "Modell" }).first().fill("Sultan RS");
  await page.getByRole("textbox", { name: "Kennzeichen" }).first().fill("  8ben  42 ");
  // Neu startet mit einer Zeile; die zweite kommt per Knopf dazu.
  await page.getByRole("button", { name: "+ Fahrzeug hinzufügen" }).click();
  await page.getByRole("textbox", { name: "Modell" }).nth(1).fill("Infernus");
  await page.getByRole("textbox", { name: "Kennzeichen" }).nth(1).fill("VICE86E");

  await page.getByRole("button", { name: "Speichern" }).click();

  await page.goto("/kunden");
  await page.getByPlaceholder("Name, Rufnummer oder Kennzeichen").fill("8ben");

  const row = page.getByRole("row", { name: /Carlos Ramirez E2E/ });
  await expect(row).toContainText("8BEN 42");
  await expect(row).toContainText("VICE86E");
});

test("manuelle Gutschrift erscheint auf der Stempelkarte", async ({ page }) => {
  // Treuesystem per Factory aktiv – geklickt wird nur der Weg, den ein Mitarbeiter geht.
  await prisma.loyaltySettings.update({
    where: { id: 1 },
    data: { enabled: true, mode: "STAMPS", cardSize: 10 },
  });

  await prisma.loyaltyReward.create({
    data: { name: "Zehn Prozent E2E", type: "PERCENT_DISCOUNT", value: 10, cost: 10 },
  });

  const customer = await prisma.customer.create({ data: { name: "Stempelkunde E2E" } });

  await page.goto(`/kunden/${customer.number}`);

  await page.getByRole("button", { name: "Treue buchen" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("spinbutton", { name: "Betrag" }).fill("7");
  await dialog.getByRole("textbox", { name: "Notiz" }).fill("Papierkarte");
  await dialog.getByRole("button", { name: "Buchen" }).click();

  await expect(page.getByText("Noch 3 Stempel bis „Zehn Prozent E2E“")).toBeVisible();
  expect(await page.locator('[data-stamp="filled"]').count()).toBe(7);

  await expect(page.getByText("1 volle Karte + 3")).toHaveCount(0);

  // Der letzte Besuch steht jetzt da.
  await expect(page.getByText(/Letzter Besuch:/)).toBeVisible();
});

test("Suche ohne Treffer zeigt den Leerzustand", async ({ page }) => {
  await page.goto("/kunden");

  await page.getByPlaceholder("Name, Rufnummer oder Kennzeichen").fill("nichtsda");

  await expect(page.getByText("Keine Kunden gefunden.")).toBeVisible();
});

test("Fahrzeug nachträglich ergänzen", async ({ page }) => {
  await page.goto("/kunden/neu");
  await page.getByRole("textbox", { name: "Name" }).fill("Nadja Wehr E2E");
  await page.getByRole("textbox", { name: "Modell" }).first().fill("Blista");
  await page.getByRole("textbox", { name: "Kennzeichen" }).first().fill("NADJA1");
  await page.getByRole("button", { name: "Speichern" }).click();

  await page.goto("/kunden");
  await page.getByPlaceholder("Name, Rufnummer oder Kennzeichen").fill("NADJA1");
  await page.getByRole("row", { name: /Nadja Wehr E2E/ }).getByRole("link").first().click();

  await page.getByRole("button", { name: "Bearbeiten" }).click();
  await page.getByRole("button", { name: "+ Fahrzeug hinzufügen" }).click();
  await page.getByRole("textbox", { name: "Modell" }).nth(1).fill("Glider");
  await page.getByRole("textbox", { name: "Kennzeichen" }).nth(1).fill("NADJA2");
  await page.getByRole("button", { name: "Speichern" }).click();

  await expect(page.getByText("Kunde aktualisiert.")).toBeVisible();
  await expect(page.getByText("NADJA2").first()).toBeVisible();
});
