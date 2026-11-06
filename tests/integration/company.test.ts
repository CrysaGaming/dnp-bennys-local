import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { GET } from "@/app/api/status/route";
import { getCompanySettings, updateCompanySettings } from "@/features/company/service";
import { getCompanyStatus } from "@/lib/company-status";
import { ForbiddenError } from "@/lib/errors";
import { createUserWithEmployee, makeCtx } from "@tests/helpers/factories";

const input = {
  name: "Benny's",
  phone: "",
  radioChannel: "1234",
  radioPassword: "0000",
  statusMode: "AUTO",
  manualOpen: false,
  minOnDuty: 3,
  logoVariant: "LOS_SANTOS",
};

describe("Firmeneinstellungen", () => {
  it("lehnt ohne COMPANY_MANAGE ab", async () => {
    const ctx = await makeCtx({ username: "firma-ohne-recht" });

    await expect(updateCompanySettings(ctx, input)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("speichert leere Felder als null und auditiert before/after", async () => {
    const ctx = await makeCtx({ permissions: ["COMPANY_MANAGE"], username: "firma-mit-recht" });

    const saved = await updateCompanySettings(ctx, input);

    expect(saved).toMatchObject({
      phone: null,
      radioChannel: "1234",
      radioPassword: "0000",
      minOnDuty: 3,
      logoVariant: "LOS_SANTOS",
    });

    const audit = await prisma.auditLog.findFirstOrThrow({ where: { action: "company.update" } });
    expect(audit).toMatchObject({ actorId: ctx.userId, entity: "company_settings", entityId: "1" });

    const data = audit.data as { before: { minOnDuty: number }; after: { minOnDuty: number } };
    expect(data.before.minOnDuty).toBe(1);
    expect(data.after.minOnDuty).toBe(3);
  });

  it("zählt nur offene Stempel von aktiven Mitarbeitern", async () => {
    await getCompanySettings(); // Standard: AUTO, minOnDuty 1

    const aktiv = await createUserWithEmployee({ username: "stempel-aktiv" });
    const gekuendigt = await createUserWithEmployee({ username: "stempel-kuendigt" });
    const geschlossen = await createUserWithEmployee({ username: "stempel-zu" });

    await prisma.employee.update({
      where: { id: gekuendigt.employee.id },
      data: { status: "TERMINATED" },
    });

    for (const e of [aktiv.employee, gekuendigt.employee, geschlossen.employee]) {
      await prisma.timeEntry.create({
        data: {
          employeeId: e.id,
          clockIn: new Date("2026-01-05T09:00:00Z"),
          clockOut: e.id === geschlossen.employee.id ? new Date("2026-01-05T17:00:00Z") : null,
        },
      });
    }

    const status = await getCompanyStatus();

    expect(status).toMatchObject({ isOpen: true, mode: "AUTO", onDutyCount: 1 });
  });

  it("gibt 401 ohne Session", async () => {
    const res = await GET(new Request("http://localhost:3100/api/status"));

    expect(res.status).toBe(401);
  });
});
