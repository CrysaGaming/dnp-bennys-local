import { expect, test, type Page } from "@playwright/test";

const STORAGE_STATE = "tests/e2e/.auth/admin.json";

test.use({ storageState: STORAGE_STATE });

/** Die Specs teilen sich eine DB – Namen pro Spec eindeutig. */
async function quickAdd(page: Page, name: string, kg: string, price: string, category: string) {
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Gewicht (kg)").fill(kg);
  await page.getByLabel("Export-Preis ($)").fill(price);
  await page.getByRole("radio", { name: category }).click();
  await page.getByLabel("Export-Preis ($)").press("Enter");

  await expect(page.getByLabel("Name")).toBeFocused();
}

test("Schnelleingabe, Filter, Suche, Reload", async ({ page }) => {
  await page.goto("/ressourcen");

  const rows: [string, string, string, string][] = [
    ["Eisenerz R1", "2,5", "45", "Rohstoff"],
    ["Stahlbarren R1", "1,5", "180", "Zwischenprodukt"],
    ["Motorblock R1", "25", "2400", "Endprodukt"],
  ];

  for (const [name, kg, price, cat] of rows) {
    await quickAdd(page, name, kg, price, cat);
  }

  await page.getByRole("checkbox", { name: /Rohstoff/ }).check();
  await page.getByPlaceholder("Suchen …").fill("erz");

  // Kopf + Eisenerz R1.
  await expect(page.getByRole("row")).toHaveCount(2);

  // Der URL-Zustand muss gesetzt sein, bevor neu geladen wird. Der Schreiben ist ein
  // clientseitiger push – ohne dieses Warten hängt der Test am Timing und lädt ohne Parameter.
  await expect(page).toHaveURL(/q=erz&kat=RAW/);

  await page.reload();

  await expect(page.getByRole("row", { name: /Eisenerz R1/ })).toBeVisible();
  await expect(page.getByRole("row", { name: /Stahlbarren R1/ })).toHaveCount(0);

  await expect(page).toHaveURL(/kat=RAW/);
});

test("Gewicht mit Punkt (Review Focus 1)", async ({ page }) => {
  await page.goto("/ressourcen");

  await quickAdd(page, "Kupferdraht R2", "1.500", "12", "Zwischenprodukt");

  await expect(page.getByRole("row", { name: /Kupferdraht R2/ })).toContainText("1,5 kg");
});

test("Dublette zeigt den Feldfehler", async ({ page }) => {
  await page.goto("/ressourcen");

  await quickAdd(page, "Zinn R3", "1", "20", "Rohstoff");

  await page.getByLabel("Name").fill("zinn r3");
  await page.getByLabel("Gewicht (kg)").fill("1");
  await page.getByLabel("Export-Preis ($)").fill("20");
  await page.getByRole("radio", { name: "Rohstoff" }).click();
  await page.getByLabel("Export-Preis ($)").press("Enter");

  await expect(page.getByText("Diese Ressource gibt es schon")).toBeVisible();
});

test("Slash fokussiert die Suche", async ({ page }) => {
  await page.goto("/ressourcen");

  // Ein Tastendruck vor der Hydration trifft keinen Listener – bedingt warten und
  // wiederholen, statt auf ein Timing zu setzen.
  await expect(async () => {
    await page.keyboard.press("/");
    await expect(page.getByPlaceholder("Suchen …")).toBeFocused({ timeout: 1000 });
  }).toPass({ timeout: 15_000 });
});

test("$/kg und Gewicht 0", async ({ page }) => {
  await page.goto("/ressourcen");

  await quickAdd(page, "Nickel R5", "2,5", "45", "Rohstoff");
  await quickAdd(page, "Schrauben R5", "0", "5", "Endprodukt");

  await expect(page.getByRole("row", { name: /Nickel R5/ })).toContainText("$18");
  await expect(page.getByRole("row", { name: /Schrauben R5/ }).getByText("–")).toBeVisible();
});
