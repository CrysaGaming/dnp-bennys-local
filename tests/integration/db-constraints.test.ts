import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import { createUserWithEmployee } from "@tests/helpers/factories";

describe("Constraints aus Spec 7.4", () => {
  it("lehnt negativen Lagerbestand ab", async () => {
    await expect(prisma.part.create({ data: { name: "Bremsscheibe", stock: -1 } })).rejects.toThrow();
  });

  it("erlaubt nur einen offenen Stempel pro Mitarbeiter", async () => {
    const { employee } = await createUserWithEmployee();
    await prisma.timeEntry.create({ data: { employeeId: employee.id } });
    await expect(prisma.timeEntry.create({ data: { employeeId: employee.id } })).rejects.toThrow();
  });

  it("lehnt doppelten Ressourcennamen ohne Groß/Klein-Unterschied ab", async () => {
    await prisma.resource.create({
      data: { name: "Eisenerz", category: "RAW", weightGrams: 2500, exportPrice: 45 },
    });
    await expect(
      prisma.resource.create({
        data: { name: "eisenerz", category: "RAW", weightGrams: 1, exportPrice: 1 },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  });

  it("lehnt negatives Treueguthaben ab", async () => {
    await expect(prisma.customer.create({ data: { name: "Carlos Ramirez", loyaltyBalance: -1 } })).rejects.toThrow();
  });

  it("erlaubt nur CompanySettings mit id 1", async () => {
    await expect(prisma.companySettings.create({ data: { id: 2 } })).rejects.toThrow();
  });
});
