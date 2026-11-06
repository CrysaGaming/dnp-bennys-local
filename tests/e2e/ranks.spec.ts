import { expect, test } from "@playwright/test";

const STORAGE_STATE = "tests/e2e/.auth/admin.json";

/**
 * Ränge-Creator (Spec 5.9). Die Interaktionen laufen im Client, darum wird hier
 * bedingt gewartet und geklickt: vor der Hydration trifft ein Klick zwar das Element,
 * aber keinen React-Handler.
 */
test.describe("Ränge", () => {
  test.use({ storageState: STORAGE_STATE });

  test("Rang anlegen mit Abhängigkeit", async ({ page }) => {
    await page.goto("/raenge");

    await expect(async () => {
      await page.getByRole("button", { name: "Neuer Rang" }).click();
      await expect(page.getByLabel("Name")).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15_000 });

    await page.getByLabel("Name").fill("Mechaniker");
    await page.getByLabel("Level").fill("20");

    const verwalten = page.getByRole("checkbox", { name: "Ressourcen: Verwalten" });
    const ansehen = page.getByRole("checkbox", { name: "Ressourcen: Ansehen" });

    await expect(async () => {
      await verwalten.click();
      await expect(verwalten).toHaveAttribute("aria-checked", "true");
      // Das Ansehen wird automatisch mitgesetzt (Spec 5.9).
      await expect(ansehen).toHaveAttribute("aria-checked", "true");
    }).toPass({ timeout: 15_000 });

    await page.getByRole("button", { name: "Rang speichern" }).click();

    await expect(page.getByRole("row", { name: /Mechaniker/ })).toContainText("2 Rechte");
  });

  test("Admin-Rang hat Schloss statt Menü", async ({ page }) => {
    await page.goto("/raenge");

    const row = page.getByRole("row", { name: /Admin/ });
    await expect(row.getByLabel("Geschützter System-Rang")).toBeVisible();
    await expect(row.getByRole("button", { name: "Aktionen" })).toHaveCount(0);
  });
});
