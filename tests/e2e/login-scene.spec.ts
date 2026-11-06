import { expect, test } from "@playwright/test";
import { startScene } from "./helpers/login";

/**
 * Login-Szene (Spec 6.1–6.3). Als Quelle dient die Stille aus Task 3.2, damit der
 * Testlauf nicht vom Suno-Song abhängt.
 */
test.describe("Login-Szene", () => {
  test("Intro, dann Formular", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByText("DRÜCKE EINE TASTE ODER KLICKE")).toBeVisible();

    await startScene(page);
  });

  test("falsches Passwort zeigt Banner und Klartext", async ({ page }) => {
    await page.goto("/login");
    await startScene(page);

    await page.getByRole("textbox", { name: "Benutzername" }).fill("max");
    await page.getByRole("textbox", { name: "Passwort" }).fill("falsch-falsch");
    await page.getByRole("button", { name: "Einloggen" }).click();

    await expect(page.getByText("ZUGRIFF VERWEIGERT")).toBeVisible();
    await expect(page.getByText("Benutzername oder Passwort falsch.")).toBeVisible();
  });

  test("Mute bleibt nach Reload", async ({ page }) => {
    await page.goto("/login");
    await startScene(page);

    // Das Label des Buttons wechselt mit dem Zustand – der Locator darf daran nicht hängen.
    const mute = page.getByRole("button", { name: /Musik (stummschalten|einschalten)/ });
    await expect(mute).toBeVisible();
    await mute.click();
    await expect(mute).toHaveAttribute("aria-pressed", "true");

    await page.reload();
    await startScene(page);

    await expect(page.getByRole("button", { name: "Musik einschalten" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("reduzierte Bewegung zeigt Standbild", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();

    await page.goto("/login");
    await startScene(page);

    await expect(page.locator("[data-slideshow]")).toHaveAttribute("data-static", "true");

    await context.close();
  });
});
