import type { Page } from "@playwright/test";

/** Login über das Formular – so, wie ein Mitarbeiter es im Browser macht. */
export async function loginAs(page: Page, username: string, password: string): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Benutzername").fill(username);
  await page.getByLabel("Passwort").fill(password);
  await page.getByRole("button", { name: "Einloggen" }).click();
}
