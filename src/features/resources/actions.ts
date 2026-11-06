"use server";

import { runAction, type ActionResult } from "@/lib/action";
import type { ResourceInput } from "./schemas";
import { createResource, deleteResource, listResources, updateResource } from "./service";

export async function listResourcesAction(): Promise<ActionResult<unknown>> {
  return runAction((ctx) => listResources(ctx), { revalidate: [["/ressourcen", "page"]] });
}

export async function createResourceAction(input: ResourceInput): Promise<ActionResult<unknown>> {
  return runAction((ctx) => createResource(ctx, input), { revalidate: [["/ressourcen", "page"]] });
}

export async function updateResourceAction(id: string, input: ResourceInput): Promise<ActionResult<unknown>> {
  return runAction((ctx) => updateResource(ctx, id, input), { revalidate: [["/ressourcen", "page"]] });
}

export async function deleteResourceAction(id: string): Promise<ActionResult<unknown>> {
  return runAction((ctx) => deleteResource(ctx, id), { revalidate: [["/ressourcen", "page"]] });
}
