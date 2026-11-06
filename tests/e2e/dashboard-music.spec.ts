import { chromium, expect, test } from "@playwright/test";
import { prisma } from "./helpers/db";

const STORAGE_STATE = "tests/e2e/.auth/admin.json";

/**
 * Review Focus aus Plan 02: Autoplay ist im Browser blockiert. Nach dem Neuladen im
 * Dashboard zeigt der Button „pausiert“, die Musik startet erst mit der ersten
 * Nutzeraktion. Als Quelle dient die Stille aus Task 3.2.
 *
 * Zwei Dinge machen diese Tests fragil, darum hier bedingt gewartet und wiederholt:
 * 1) Ein Klick vor der Hydration trifft das Element, aber keinen React-Handler.
 * 2) Ein Klick im selben Tab gilt als Nutzeraktion und erlaubt Autoplay – die
 *    Einstellung wird deshalb per Factory gesetzt und der Page frisch geöffnet.
 */
test.describe("Musik im Dashboard", () => {
  test.use({ storageState: STORAGE_STATE });

  test("die Einstellung wird gespeichert", async ({ page }) => {
    await page.goto("/settings");

    const sw = page.getByRole("switch", { name: "Musik im Dashboard" });
    const save = page.getByRole("button", { name: "Musik speichern" });
    const admin = await prisma.user.findFirst({ where: { username: "admin" } });

    await expect(async () => {
      // Idempotent: ein zweiter Klick würde den Schalter zurückwerfen, also nur wenn nötig.
      if ((await sw.getAttribute("aria-checked")) !== "true") await sw.click();
      await save.click();

      const row = await prisma.userPreference.findFirst({ where: { userId: admin!.id } });
      expect(row).toMatchObject({ dashboardMusic: true, musicVolume: 35 });
    }).toPass({ timeout: 20_000 });
  });

  test("pausiert bis zur ersten Aktion, dann läuft sie", async () => {
    const admin = await prisma.user.findFirst({ where: { username: "admin" } });
    await prisma.userPreference.upsert({
      where: { userId: admin!.id },
      create: { userId: admin!.id, dashboardMusic: true, musicVolume: 35 },
      update: { dashboardMusic: true, musicVolume: 35 },
    });

    // Eigenes Profil: die anderen Specs klicken auf localhost und heben damit den
    // Media-Engagement-Wert im gemeinsamen Profil – dann wäre Autoplay nicht mehr
    // blockiert und der Test hinge von der Browser-Historie ab, nicht von unserem Code.
    const browser = await chromium.launch({ args: ["--autoplay-policy=user-gesture-required"] });
    const context = await browser.newContext({ storageState: STORAGE_STATE });
    const page = await context.newPage();

    await page.goto("http://localhost:3100/dashboard");

    const button = page.getByRole("button", { name: "Musik im Dashboard" });
    await expect(button).toHaveAttribute("data-state", "paused");

    await expect(async () => {
      await page.getByRole("heading", { level: 1 }).click();
      await expect(button).toHaveAttribute("data-state", "playing");
    }).toPass({ timeout: 20_000 });

    await context.close();
    await browser.close();
  });
});
