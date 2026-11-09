import { expect, test } from "@playwright/test";
import { prisma } from "./helpers/db";

const STORAGE_STATE = "tests/e2e/.auth/admin.json";

test.use({ storageState: STORAGE_STATE });

/**
 * Der Gesamtablauf über alle Seiten hinweg. Namen sind pro Spec eindeutig, weil sich die Specs
 * die Test-DB teilen.
 */
test("Auftrag → Rechnung → bezahlt → Stempel → Einlösen", async ({ page }) => {
  await prisma.loyaltySettings.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      enabled: true,
      mode: "STAMPS",
      stampsPerVisit: 1,
      minVisitTotal: 500,
      cooldownHours: 12,
      cardSize: 10,
    },
    update: { enabled: true, mode: "STAMPS", stampsPerVisit: 1, minVisitTotal: 500, cooldownHours: 12, cardSize: 10 },
  });

  await prisma.loyaltyReward.create({
    data: { name: "Zwanzig Prozent E2E", type: "PERCENT_DISCOUNT", value: 20, cost: 1 },
  });

  const category = await prisma.priceCategory.create({ data: { name: "Tuning E2E" } });
  await prisma.priceListItem.create({
    data: { name: "Motor-Tuning Stufe 1 E2E", price: 1200, categoryId: category.id },
  });

  const customer = await prisma.customer.create({ data: { name: "Carlos Ramirez OF", phone: "555-0199" } });
  await prisma.vehicle.create({ data: { customerId: customer.id, plate: "8BEN 42E", model: "Sultan RS" } });

  await page.goto("/auftraege/neu");

  await page.getByRole("combobox", { name: "Kunde" }).fill("8ben");
  await page.getByRole("option", { name: /Carlos Ramirez OF/ }).click();

  await page.getByRole("combobox", { name: "Typ" }).click();
  await page.getByRole("option", { name: "Tuning" }).click();

  await page.getByRole("button", { name: "Auftrag anlegen" }).click();

  await expect(page).toHaveURL(/\/auftraege\/\d+/);
  await expect(page.getByRole("heading", { name: /Auftrag #/ })).toBeVisible();

  await page.getByRole("combobox", { name: "Leistung" }).click();
  await page.getByRole("option", { name: "Motor-Tuning Stufe 1 E2E" }).click();
  await page.getByRole("button", { name: "Hinzufügen" }).click();

  // Die Summe steht mehrfach im DOM (Position und Gesamt) – geprüft wird die Zeile im Summenblock.
  await expect(page.getByText("Gesamt")).toBeVisible();
  await expect(page.locator("dd").filter({ hasText: "$1.200" }).first()).toBeVisible();

  await page.getByRole("button", { name: "Erledigt" }).click();
  await page.getByRole("button", { name: "Rechnung erstellen" }).click();

  // Die Action läuft im Hintergrund – die Liste kann leer sein, wenn sofort navigiert wird.
  await expect(async () => {
    await page.goto("/rechnungen");
    await expect(page.getByRole("row", { name: /Carlos Ramirez OF/ })).toBeVisible({ timeout: 3000 });
  }).toPass({ timeout: 20_000 });

  await expect(page.getByRole("heading", { name: "Rechnungen" })).toBeVisible();

  const invoiceRow = page.getByRole("row", { name: /Carlos Ramirez OF/ });
  await invoiceRow.getByRole("button", { name: "Bezahlt markieren" }).click();

  await page.getByRole("radiogroup").getByRole("radio", { name: "Bar" }).click();
  await page.getByRole("button", { name: "Bezahlt", exact: true }).click();

  await expect(page.getByText("Bezahlt. +1 Stempel für Carlos Ramirez OF")).toBeVisible();

  await page.goto(`/kunden/${customer.number}`);
  await expect(page.locator('[data-stamp="filled"]')).toHaveCount(1);

  await page.getByRole("link", { name: "Einlösen" }).click();

  await expect(page.getByRole("heading", { name: "Neuer Auftrag" })).toBeVisible();
  // Der Text steckt auch im Flugdatensatz der Seite – ohne Bezug zum Dialog gewinnt das Skript.
  await expect(page.getByRole("dialog").getByText("Zwanzig Prozent E2E")).toBeVisible();

  await page.getByRole("button", { name: "Auftrag anlegen" }).click();
  await expect(page).toHaveURL(/\/auftraege\/\d+/);

  await page.getByRole("combobox", { name: "Leistung" }).click();
  await page.getByRole("option", { name: "Motor-Tuning Stufe 1 E2E" }).click();
  await page.getByRole("button", { name: "Hinzufügen" }).click();

  await expect(page.locator("dd").filter({ hasText: "$240" }).first()).toBeVisible();
  await expect(page.locator("dd").filter({ hasText: "$960" }).first()).toBeVisible();

  await page.goto(`/kunden/${customer.number}`);
  await expect(page.getByText("0 / 10 Stempel")).toBeVisible();
});
