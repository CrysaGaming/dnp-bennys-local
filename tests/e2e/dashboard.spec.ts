import { expect, test } from "@playwright/test";
import { prisma } from "./helpers/db";

const STORAGE_STATE = "tests/e2e/.auth/admin.json";

test.use({ storageState: STORAGE_STATE });

/**
 * Die Karten zeigen, was in der DB steht. Die Specs teilen sich die DB, darum wird die Erwartung
 * aus der DB gelesen und nicht als feste Zahl geschrieben.
 */
test("Dashboard-Karten und letzte Aufträge", async ({ page }) => {
  const customer = await prisma.customer.create({ data: { name: "Dash Kartenkunde OF" } });
  const employee = await prisma.employee.findFirstOrThrow();

  const open = await prisma.order.create({
    data: { type: "REPAIR", customerId: customer.id, status: "OPEN", createdById: employee.id, total: 250 },
  });

  await prisma.order.create({
    data: { type: "TUNING", customerId: customer.id, status: "IN_PROGRESS", createdById: employee.id, total: 400 },
  });

  await prisma.part.create({ data: { name: "Dash Knappteil", stock: 1, minStock: 4 } });

  const openCount = await prisma.order.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } });
  const lowCount = await prisma.part.count({ where: { stock: { lt: 4 }, name: "Dash Knappteil" } });

  await page.goto("/dashboard");

  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  const openCard = page.locator("[data-kpi]").filter({ hasText: "Offene Aufträge" });
  await expect(openCard).toContainText(String(openCount));

  const stockCard = page.locator("[data-kpi]").filter({ hasText: "Lager" });
  await expect(stockCard).toContainText(`${lowCount} knapp`);

  await expect(page.getByText("Letzte Aufträge")).toBeVisible();
  await expect(page.getByRole("link", { name: new RegExp(`#${String(open.number).padStart(4, "0")}`) })).toBeVisible();
});
