"use server";

import { runAction, type ActionResult } from "@/lib/action";
import {
  createEmployee,
  listEmployees,
  resetEmployeePassword,
  terminateEmployee,
  updateEmployee,
  type EmployeeRow,
} from "./service";
import type { EmployeeStatus } from "@/generated/prisma/enums";

/** Dünne Actions – Rechte und Hierarchie prüft der Service (Spec 4.4). */
export async function listEmployeesAction(
  filter: { rankId?: string; status?: EmployeeStatus } = {},
): Promise<ActionResult<EmployeeRow[]>> {
  return runAction((ctx) => listEmployees(ctx, filter), {
    revalidate: [["/mitarbeiter", "page"]],
  });
}

export async function createEmployeeAction(
  input: unknown,
): Promise<ActionResult<{ employeeId: string; startPassword: string }>> {
  return runAction((ctx) => createEmployee(ctx, input), {
    revalidate: [["/mitarbeiter", "page"]],
  });
}

export async function updateEmployeeAction(id: string, input: unknown): Promise<ActionResult<void>> {
  return runAction((ctx) => updateEmployee(ctx, id, input), {
    revalidate: [["/mitarbeiter", "page"]],
  });
}

export async function terminateEmployeeAction(
  id: string,
  reason: string | null,
): Promise<ActionResult<void>> {
  return runAction((ctx) => terminateEmployee(ctx, id, reason), {
    revalidate: [["/mitarbeiter", "page"]],
  });
}

export async function resetEmployeePasswordAction(
  id: string,
): Promise<ActionResult<{ startPassword: string }>> {
  return runAction((ctx) => resetEmployeePassword(ctx, id), {
    revalidate: [["/mitarbeiter", "page"]],
  });
}
