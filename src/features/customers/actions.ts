"use server";

import { runAction, type ActionResult } from "@/lib/action";
import type { CustomerInput, VehicleInput } from "./schemas";
import {
  addVehicle,
  createCustomer,
  deleteCustomer,
  getCustomerByNumber,
  removeVehicle,
  searchCustomers,
  updateCustomer,
} from "./service";

export async function searchCustomersAction(q: string): Promise<ActionResult<unknown>> {
  return runAction((ctx) => searchCustomers(ctx, q), { revalidate: [["/kunden", "page"]] });
}

export async function customerByNumberAction(number: number): Promise<ActionResult<unknown>> {
  return runAction((ctx) => getCustomerByNumber(ctx, number), { revalidate: [["/kunden", "page"]] });
}

export async function saveCustomerAction(input: CustomerInput): Promise<ActionResult<unknown>> {
  return runAction((ctx) => createCustomer(ctx, input), { revalidate: [["/kunden", "page"]] });
}

export async function updateCustomerAction(id: string, input: CustomerInput): Promise<ActionResult<unknown>> {
  return runAction((ctx) => updateCustomer(ctx, id, input), { revalidate: [["/kunden", "page"]] });
}

export async function addVehicleAction(customerId: string, vehicle: VehicleInput): Promise<ActionResult<unknown>> {
  return runAction((ctx) => addVehicle(ctx, customerId, vehicle), {
    revalidate: [["/kunden", "page"]],
  });
}

export async function removeVehicleAction(vehicleId: string): Promise<ActionResult<unknown>> {
  return runAction((ctx) => removeVehicle(ctx, vehicleId), { revalidate: [["/kunden", "page"]] });
}

export async function deleteCustomerAction(id: string): Promise<ActionResult<unknown>> {
  return runAction((ctx) => deleteCustomer(ctx, id), { revalidate: [["/kunden", "page"]] });
}
