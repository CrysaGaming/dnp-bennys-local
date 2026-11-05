import { describe, expect, it } from "vitest";
import { seed } from "../../prisma/seed";
import { prisma } from "@/lib/prisma";
import { seedEnv } from "@tests/helpers/factories";
import { Permission } from "@/generated/prisma/enums";

describe("Seed", () => {
  it("legt Admin-Rang mit allen Rechten an", async () => {
    await seed(prisma, seedEnv);

    const rank = await prisma.rank.findUniqueOrThrow({ where: { level: 100 } });
    expect(rank).toMatchObject({ name: "Admin", isSystem: true });
    expect(rank.permissions.length).toBe(Object.values(Permission).length);
  });

  it("ist idempotent", async () => {
    await seed(prisma, seedEnv);
    await seed(prisma, seedEnv);

    expect(await prisma.rank.count()).toBe(1);
    expect(await prisma.user.count()).toBe(1);
    expect(await prisma.priceCategory.count()).toBe(6);
  });

  it("überschreibt geänderte Firmeneinstellungen nicht", async () => {
    await seed(prisma, seedEnv);
    await prisma.companySettings.update({ where: { id: 1 }, data: { phone: "555-0199" } });
    await seed(prisma, seedEnv);

    const settings = await prisma.companySettings.findUniqueOrThrow({ where: { id: 1 } });
    expect(settings.phone).toBe("555-0199");
  });

  it("setzt Startwerte", async () => {
    await seed(prisma, seedEnv);

    const settings = await prisma.companySettings.findUniqueOrThrow({ where: { id: 1 } });
    expect(settings).toMatchObject({
      name: "Benny's",
      phone: null,
      radioChannel: "1234",
      radioPassword: "0000",
      logoVariant: "VICE_CITY",
    });

    const loyalty = await prisma.loyaltySettings.findUniqueOrThrow({ where: { id: 1 } });
    expect(loyalty).toMatchObject({ enabled: false });

    expect(await prisma.loyaltyReward.count()).toBe(0);
  });

  it("stellt Admin-Rechte wieder her", async () => {
    await seed(prisma, seedEnv);
    await prisma.rank.update({ where: { level: 100 }, data: { permissions: [] } });
    await seed(prisma, seedEnv);

    const rank = await prisma.rank.findUniqueOrThrow({ where: { level: 100 } });
    expect(rank.permissions.length).toBe(Object.values(Permission).length);
  });

  it("Admin-User muss Passwort ändern", async () => {
    await seed(prisma, seedEnv);

    const employee = await prisma.employee.findFirstOrThrow({ include: { user: true } });
    expect(employee).toMatchObject({
      serviceNumber: 1,
      mustChangePassword: true,
      user: { username: "admin", role: "admin" },
    });
  });
});
