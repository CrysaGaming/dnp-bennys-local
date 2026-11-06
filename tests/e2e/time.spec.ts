import { expect, test } from "@playwright/test";

const STORAGE_STATE = "tests/e2e/.auth/admin.json";

/**
 * Stempeluhr und Auto-Status (Spec 5.7): Seed-Standard ist Modus AUTO mit
 * Mindestbesetzung 1 – ohne offenen Stempel ist also geschlossen.
 */
test.describe("Stempeluhr", () => {
  test.use({ storageState: STORAGE_STATE });

  test("Einstempeln öffnet, Ausstempeln schließt", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page.getByText("GESCHLOSSEN")).toBeVisible();

    // Die Knöpfe gehören zu einem Client-Component – ein Klick vor der Hydration geht
    // verloren, also bedingt warten und wiederholen.
    await expect(async () => {
      await page.getByRole("button", { name: "Einstempeln" }).click();
      await expect(page.getByText("GEÖFFNET")).toBeVisible({ timeout: 3000 });
    }).toPass({ timeout: 15_000 });

    await expect(async () => {
      await page.getByRole("button", { name: "Ausstempeln" }).click();
      await expect(page.getByText("GESCHLOSSEN")).toBeVisible({ timeout: 3000 });
    }).toPass({ timeout: 15_000 });
  });
});
