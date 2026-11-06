import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  addVehicle,
  createCustomer,
  deleteCustomer,
  getCustomerByNumber,
  removeVehicle,
  searchCustomers,
  updateCustomer,
} from "@/features/customers/service";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { createCustomer as makeCustomer } from "@tests/helpers/factories";
import { makeCtx } from "@tests/helpers/factories";

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Kunden", () => {
  it("Kennzeichen wird normalisiert gespeichert", async () => {
    const ctx = await makeCtx({ permissions: ["CUSTOMERS_EDIT"] });

    const { customer } = await createCustomer(ctx, {
      name: "Carlos Ramirez",
      phone: "555-0123",
      vehicles: [{ model: "Sultan RS", plate: "  8ben  42 ", color: "blau" }],
    });

    const vehicle = await prisma.vehicle.findFirstOrThrow({ where: { customerId: customer.id } });
    expect(vehicle.plate).toBe("8BEN 42");
    expect(customer.number).toBe(1);
  });

  it("zweites Kunden-Kennzeichen ist ein Konflikt", async () => {
    const ctx = await makeCtx({ permissions: ["CUSTOMERS_EDIT"] });

    await createCustomer(ctx, { name: "Erster", vehicles: [{ model: "Buffalo", plate: "BMM 42" }] });

    const err = await createCustomer(ctx, {
      name: "Zweiter",
      vehicles: [{ model: "Bliss", plate: "bmm 42" }],
    }).catch((e) => e);

    expect(err).toBeInstanceOf(ConflictError);
    expect(err.field).toBe("vehicles.0.plate");
    expect(err.message).toBe("Kennzeichen ist schon vergeben");
  });

  it("zweimal dasselbe Kennzeichen in einer Eingabe", async () => {
    const ctx = await makeCtx({ permissions: ["CUSTOMERS_EDIT"] });

    const err = await createCustomer(ctx, {
      name: "Doppelt",
      vehicles: [
        { model: "Sultan RS", plate: "VICE86" },
        { model: "Infernus", plate: "vice86" },
      ],
    }).catch((e) => e);

    expect(err).toBeInstanceOf(ConflictError);
    expect(err.field).toBe("vehicles.1.plate");
  });

  it("gleiche Rufnummer ist kein Fehler, aber eine Warnung", async () => {
    const ctx = await makeCtx({ permissions: ["CUSTOMERS_EDIT"] });

    await createCustomer(ctx, { name: "Erster", phone: "555-0123" });

    const { warnings } = await createCustomer(ctx, { name: "Zweiter", phone: "555-0123" });
    const zweiter = await prisma.customer.findFirstOrThrow({ where: { name: "Zweiter" } });

    expect(warnings).toEqual(["Rufnummer ist schon bei Kunde #0001 hinterlegt."]);
    expect(zweiter.number).toBe(2);

    // Ohne doppelte Nummer bleibt die Warnung leer.
    const clean = await createCustomer(ctx, { name: "Dritter", phone: "555-9999" });
    expect(clean.warnings).toEqual([]);
  });

  it("Sucht über Name, Kennzeichen und Ziffern der Rufnummer", async () => {
    const writer = await makeCtx({ permissions: ["CUSTOMERS_EDIT"] });
    const ctx = await makeCtx({ permissions: ["CUSTOMERS_VIEW"] });

    await createCustomer(writer, {
      name: "Carlos Ramirez",
      phone: "555-0123",
      vehicles: [{ model: "Sultan RS", plate: "8BEN 42" }],
    });

    expect((await searchCustomers(ctx, "carl")).map((c) => c.name)).toContain("Carlos Ramirez");
    expect((await searchCustomers(ctx, "8ben")).map((c) => c.name)).toContain("Carlos Ramirez");
    expect((await searchCustomers(ctx, "555 01")).map((c) => c.name)).toContain("Carlos Ramirez");

    // Ziffern suchen erst ab 3 Stellen – "55" wäre sonst zu viel.
    expect((await searchCustomers(ctx, "55")).map((c) => c.name)).not.toContain("Carlos Ramirez");

    // Leere Suche liefert alle, nach Name.
    expect(await searchCustomers(ctx, "")).toHaveLength(1);
  });

  it("Kunde mit Aufträgen darf nicht gelöscht werden", async () => {
    const ctx = await makeCtx({ permissions: ["CUSTOMERS_EDIT"] });
    const customer = await makeCustomer({ name: "Mit Auftrag" });

    await prisma.order.create({
      data: { type: "REPAIR", customerId: customer.id, createdById: ctx.employeeId },
    });

    await expect(deleteCustomer(ctx, customer.id)).rejects.toThrow(
      "Kunde hat Aufträge oder Treue-Buchungen und kann nicht gelöscht werden.",
    );

    // Ohne Aufträge und Buchungen geht es, mit Audit.
    const plain = await makeCustomer({ name: "Ohne Auftrag" });
    await deleteCustomer(ctx, plain.id);

    expect(await prisma.customer.count({ where: { id: plain.id } })).toBe(0);

    const audit = await prisma.auditLog.findFirst({ where: { action: "customer.delete", entityId: plain.id } });
    expect(audit).not.toBeNull();
  });

  it("Fahrzeug mit Auftrag bleibt stehen, wird nur gelöst", async () => {
    const ctx = await makeCtx({ permissions: ["CUSTOMERS_EDIT"] });
    const { customer } = await createCustomer(ctx, {
      name: "Fahrzeug",
      vehicles: [{ model: "Sultan RS", plate: "HALT1" }],
    });

    const vehicle = await prisma.vehicle.findFirstOrThrow({ where: { plate: "HALT1" } });
    await prisma.order.create({
      data: { type: "REPAIR", customerId: customer.id, vehicleId: vehicle.id, createdById: ctx.employeeId },
    });

    await removeVehicle(ctx, vehicle.id);

    const stored = await prisma.vehicle.findUnique({ where: { id: vehicle.id } });
    expect(stored).not.toBeNull();
    expect(stored?.customerId).toBeNull();

    // Ohne Auftrag wird das Fahrzeug gelöscht.
    const free = await addVehicle(ctx, customer.id, { model: "Infernus", plate: "FREI1" });
    await removeVehicle(ctx, free.id);

    expect(await prisma.vehicle.count({ where: { id: free.id } })).toBe(0);
  });

  it("ohne CUSTOMERS_EDIT ist alles Schreiben verboten", async () => {
    const ctx = await makeCtx({ permissions: ["CUSTOMERS_VIEW"] });
    const writer = await makeCtx({ permissions: ["CUSTOMERS_EDIT"] });
    const { customer } = await createCustomer(writer, { name: "Gelesen" });

    expect((await searchCustomers(ctx, ""))[0]?.name).toBe("Gelesen");

    await expect(createCustomer(ctx, { name: "Neuer Kunde" })).rejects.toThrow(ForbiddenError);
    await expect(updateCustomer(ctx, customer.id, { name: "umbenannt" })).rejects.toThrow(ForbiddenError);
    await expect(addVehicle(ctx, customer.id, { model: "Sultan", plate: "XY1" })).rejects.toThrow(ForbiddenError);
    await expect(deleteCustomer(ctx, customer.id)).rejects.toThrow(ForbiddenError);
  });

  it("Kunde per Nummer mit Fahrzeugen, Aufträgen und Buchungen", async () => {
    const ctx = await makeCtx({ permissions: ["CUSTOMERS_VIEW", "CUSTOMERS_EDIT"] });
    const { customer } = await createCustomer(ctx, {
      name: "Nummer Eins",
      vehicles: [{ model: "Sultan RS", plate: "NUM1" }],
    });

    await prisma.order.create({
      data: { type: "REPAIR", customerId: customer.id, createdById: ctx.employeeId },
    });
    // Guthaben und Buchung gehören zusammen – das setzt Task 8.2 (bookLoyalty). Hier wird
    // der Stand gesetzt, wie er nach einer Buchung in der DB stünde.
    await prisma.customer.update({ where: { id: customer.id }, data: { loyaltyBalance: 3 } });
    await prisma.loyaltyTransaction.create({
      data: { customerId: customer.id, type: "ADJUSTMENT", amount: 3, balanceAfter: 3, employeeId: ctx.employeeId },
    });

    const full = await getCustomerByNumber(ctx, customer.number);

    expect(full?.name).toBe("Nummer Eins");
    expect(full?.plates).toEqual(["NUM1"]);
    expect(full?.loyaltyBalance).toBe(3);
    expect(full?.orders).toHaveLength(1);
    expect(full?.transactions).toHaveLength(1);

    await expect(getCustomerByNumber(ctx, 9999)).rejects.toThrow(NotFoundError);
  });

  it("Fahrzeugliste ist auf zehn begrenzt", async () => {
    const ctx = await makeCtx({ permissions: ["CUSTOMERS_EDIT"] });

    const vehicles = Array.from({ length: 11 }, (_, i) => ({
      model: "Sultan RS",
      plate: `PLT${i}`,
    }));

    await expect(createCustomer(ctx, { name: "Zu viele", vehicles })).rejects.toThrow(
      "Fahrzeuge: höchstens 10",
    );
  });
});
