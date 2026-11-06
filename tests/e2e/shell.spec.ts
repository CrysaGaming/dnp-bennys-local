import { expect, test } from "@playwright/test";
import { createLoginUser, prisma } from "./helpers/db";
import { loginAs } from "./helpers/login";

const STORAGE_STATE = "tests/e2e/.auth/admin.json";

test.describe("Portal-Shell", () => {
  test.use({ storageState: STORAGE_STATE });

  test("Header zeigt Firmeninfos", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page.getByText("keine Rufnummer hinterlegt")).toBeVisible();
    await expect(page.getByText("Funk 1234 (0000)")).toBeVisible();
  });

  test("Header läuft über die ganze Breite", async ({ page }) => {
    await page.goto("/dashboard");

    const headerBox = await page.getByRole("banner").boundingBox();
    const viewport = page.viewportSize();
    const sidebarBox = await page.locator('[data-slot="sidebar-container"]').boundingBox();

    expect(headerBox?.width).toBe(viewport?.width);
    // Die Sunset-Linie gehört zum Header und muss über die ganze Breite laufen (Spec 5.2).
    const lineBox = await page.getByRole("banner").locator('[data-slot="sunset-line"]').boundingBox();
    expect(lineBox?.width).toBe(viewport?.width);
    // Die Linie ist 1 px hoch und sitzt auf der unteren Kante – in der Box zählte der
    // Pixel vor der Kante, nicht der danach.
    expect(lineBox!.y).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height - 1);
    expect(lineBox!.y).toBeLessThanOrEqual(headerBox!.y + headerBox!.height);

    // Die Sidebar darf nicht hinter dem Header beginnen.
    expect(sidebarBox?.y).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height);
  });

  test("Theme-Umschalter", async ({ page }) => {
    // next-themes liest den Wert vor dem ersten Render – so ist der Startzustand klar.
    await page.addInitScript(() => window.localStorage.setItem("theme", "dark"));
    await page.goto("/dashboard");

    const html = page.locator("html");
    await expect(html).toHaveClass(/(^|\s)dark(\s|$)/);

    await page.getByRole("button", { name: /Design wechseln/ }).click();
    await expect(html).not.toHaveClass(/(^|\s)dark(\s|$)/);

    await page.getByRole("button", { name: /Design wechseln/ }).click();
    await expect(html).toHaveClass(/(^|\s)dark(\s|$)/);
  });

  test("Logo wechseln", async ({ page }) => {
    await page.goto("/einstellungen/firma");

    await page.getByRole("radio", { name: /V1 Los Santos/ }).click();
    await page.getByRole("button", { name: "Logo übernehmen" }).click();
    // Erst warten, bis die Action durch ist – sonst läuft die Navigation der Antwort voraus.
    await expect(page.getByText("Logo übernommen.")).toBeVisible();

    await page.goto("/dashboard");
    await expect(page.locator('header [data-logo-variant="LOS_SANTOS"]')).toBeVisible();
  });

  test("Handy zeigt Emblem", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard");

    await expect(page.locator('header [data-logo-variant="EMBLEM"]').first()).toBeVisible();
  });

  test("Speichern schreibt die Einstellungen und einen Audit-Eintrag", async ({ page }) => {
    await page.goto("/einstellungen/firma");

    await page.getByLabel("Telefon").fill("0170 1234567");
    await page.getByRole("button", { name: "Speichern" }).click();

    await expect(page.getByText("Firmeneinstellungen gespeichert.")).toBeVisible();

    const settings = await prisma.companySettings.findFirst();
    expect(settings?.phone).toBe("0170 1234567");

    const audit = await prisma.auditLog.findFirst({ where: { action: "company.update" } });
    expect(audit).not.toBeNull();
  });
});

test.describe("Firmeneinstellungen ohne Recht", () => {
  // Ohne Storage-State: der Login-Test soll selbst einloggen.
  test.use({ storageState: undefined });

  test("ohne COMPANY_MANAGE ist alles schreibgeschützt", async ({ page }) => {
    await createLoginUser("ohne_firmenrecht", "Passwort-12345", { level: 42, permissions: [] });
    await loginAs(page, "ohne_firmenrecht", "Passwort-12345");
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto("/einstellungen/firma");

    await expect(page.getByLabel("Firmenname")).toBeDisabled();
    await expect(page.getByLabel("Telefon")).toBeDisabled();
    await expect(page.getByLabel("Radio-Kanal")).toBeDisabled();
    await expect(page.getByRole("radio", { name: /V1 Los Santos/ })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Logo übernehmen" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Speichern" })).toBeDisabled();
  });
});
