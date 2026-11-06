import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Das Intro (Spec 6.1) braucht eine Nutzeraktion, und die wirkt erst nach der Hydration:
 * Ein Tastendruck vor dem Anhängen des Listeners geht verloren. Darum hier bedingt
 * gewartet – drücken, bis das Formular wirklich da ist.
 */
export async function startScene(page: Page): Promise<void> {
  await expect(page.getByText("DRÜCKE EINE TASTE ODER KLICKE")).toBeVisible();

  await expect(async () => {
    await page.keyboard.press("Enter");
    await expect(page.getByLabel("Benutzername")).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15_000 });
}

/**
 * Login über das Formular – so, wie ein Mitarbeiter es im Browser macht.
 * Der Login ist ein fetch im Browser, danach läuft `router.replace`. Das Helper wartet
 * bewusst nicht: es wird auch für fehlgeschlagene Logins benutzt. Wer danach navigiert,
 * wartet selbst auf die URL – sonst läuft die nächste Navigation der Session voraus.
 */
export async function loginAs(page: Page, username: string, password: string): Promise<void> {
  await page.goto("/login");

  await startScene(page);

  await page.getByRole("textbox", { name: "Benutzername" }).fill(username);
  await page.getByRole("textbox", { name: "Passwort" }).fill(password);
  await page.getByRole("button", { name: "Einloggen" }).click();
}
