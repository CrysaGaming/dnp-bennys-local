import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createResource,
  deleteResource,
  listResources,
  updateResource,
} from "@/features/resources/service";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { makeCtx } from "@tests/helpers/factories";

afterAll(async () => {
  await prisma.$disconnect();
});

const INPUT = { name: "Eisenerz", weight: "2.5", exportPrice: "45", category: "RAW" };

describe("Ressourcen", () => {
  it("ohne RESOURCES_MANAGE darf man nur lesen", async () => {
    const reader = await makeCtx({ permissions: ["RESOURCES_VIEW"] });;
    const writer = await makeCtx({ permissions: ["RESOURCES_VIEW", "RESOURCES_MANAGE"] });

    const created = await createResource(writer, INPUT);

    await expect(createResource(reader, { ...INPUT, name: "Kupfererz " })).rejects.toThrow(ForbiddenError);
    await expect(updateResource(reader, created.id, { ...INPUT, weight: "3" })).rejects.toThrow(ForbiddenError);
    await expect(deleteResource(reader, created.id)).rejects.toThrow(ForbiddenError);

    const rows = await listResources(reader);
    expect(rows.some((r) => r.id === created.id)).toBe(true);
  });

  it("Dublette in anderer Schreibweise ist ein Konflikt", async () => {
    const ctx = await makeCtx({ permissions: ["RESOURCES_VIEW", "RESOURCES_MANAGE"] });

    await createResource(ctx, { ...INPUT, name: `Eisenerz ${randomSuffix()}` });
    const dupName = `Schrot ${randomSuffix()}`;
    await createResource(ctx, { ...INPUT, name: dupName });

    const err = await createResource(ctx, { ...INPUT, name: dupName.toLowerCase() }).catch((e) => e);

    expect(err).toBeInstanceOf(ConflictError);
    expect(err.field).toBe("name");
    expect(err.message).toBe("Diese Ressource gibt es schon");
  });

  it("Umbenennen auf den eigenen Namen in anderer Schreibweise ist erlaubt", async () => {
    const ctx = await makeCtx({ permissions: ["RESOURCES_VIEW", "RESOURCES_MANAGE"] });
    const name = `Alu ${randomSuffix()}`;

    const created = await createResource(ctx, { ...INPUT, name });
    const updated = await updateResource(ctx, created.id, { ...INPUT, name: name.toUpperCase() });

    expect(updated.name).toBe(name.toUpperCase());
  });

  it("Gewicht „1.500“ wird in Gramm gespeichert, Autor ist der Mitarbeiter", async () => {
    const ctx = await makeCtx({ permissions: ["RESOURCES_VIEW", "RESOURCES_MANAGE"] });

    const created = await createResource(ctx, {
      name: `Kupferdraht ${randomSuffix()}`,
      weight: "1.500",
      exportPrice: "12",
      category: "INTERMEDIATE",
    });

    expect(created.weightGrams).toBe(1500);
    expect(created.createdById).toBe(ctx.employeeId);

    const stored = await prisma.resource.findUniqueOrThrow({ where: { id: created.id } });
    expect(stored.weightGrams).toBe(1500);
  });

  it("zwei gleiche Anlagen zur selben Zeit: eine bekommt den Konflikt", async () => {
    const ctx = await makeCtx({ permissions: ["RESOURCES_VIEW", "RESOURCES_MANAGE"] });
    const name = `Gleich ${randomSuffix()}`;

    const results = await Promise.allSettled([
      createResource(ctx, { ...INPUT, name }),
      createResource(ctx, { ...INPUT, name: name.toUpperCase() }),
    ]);

    const conflicts = results.filter(
      (r) => r.status === "rejected" && r.reason instanceof ConflictError,
    );

    expect(conflicts).toHaveLength(1);

    const count = await prisma.resource.count({ where: { name: { equals: name, mode: "insensitive" } } });
    expect(count).toBe(1);
  });

  it("Löschen entfernt die Zeile und schreibt Audit mit dem vorherigen Namen", async () => {
    const ctx = await makeCtx({ permissions: ["RESOURCES_VIEW", "RESOURCES_MANAGE"] });
    const name = `Zum Weg ${randomSuffix()}`;

    const created = await createResource(ctx, { ...INPUT, name });
    await deleteResource(ctx, created.id);

    expect(await prisma.resource.count({ where: { id: created.id } })).toBe(0);

    const audit = await prisma.auditLog.findFirst({
      where: { action: "resource.delete", entityId: created.id },
      orderBy: { createdAt: "desc" },
    });

    expect(audit).not.toBeNull();
    expect((audit?.data as { before?: { name?: string } })?.before?.name).toBe(name);
  });

  it("Ressource, die es nicht gibt, ist nicht findbar", async () => {
    const ctx = await makeCtx({ permissions: ["RESOURCES_VIEW", "RESOURCES_MANAGE"] });

    await expect(updateResource(ctx, "fehlt", INPUT)).rejects.toThrow(NotFoundError);
    await expect(deleteResource(ctx, "fehlt")).rejects.toThrow(NotFoundError);
  });
});

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}
