import type { Page } from "@playwright/test";

/**
 * Login über das Formular – so, wie ein Mitarbeiter es im Browser macht.
 * Der Login ist ein fetch im Browser, danach läuft `router.replace`. Das Helper wartet
 * bewusst nicht: es wird auch für fehlgeschlagene Logins benutzt. Wer danach navigiert,
 * wartet selbst auf die URL – sonst läuft die nächste Navigation der Session voraus.
 */
export async function loginAs(page: Page, username: string, password: string): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Benutzername").fill(username);
  await page.getByLabel("Passwort").fill(password);
  await page.getByRole("button", { name: "Einloggen" }).click();
}
