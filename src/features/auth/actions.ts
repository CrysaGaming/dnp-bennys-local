"use server";

import { headers } from "next/headers";
import { getSessionContext, startRoute } from "@/lib/dal";

/**
 * Wohin nach dem Login? Dieselbe Regel wie in `requireSession`, aber als Wert.
 * Der Client würde sonst erst nach /dashboard navigieren und dort vom DAL zur
 * Passwortseite umgeleitet – diese Umleitung bleibt in der Client-Cache stehen
 * und wirft später jeden Sprung zurück auf /settings?pw=1.
 */
export async function startRouteAction(): Promise<string> {
  const ctx = await getSessionContext(await headers());
  return ctx ? startRoute(ctx) : "/login";
}
