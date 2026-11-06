"use server";

import { headers } from "next/headers";
import { getLoginState, startRoute } from "@/lib/dal";
import { loginNotice } from "@/lib/login-notice";

/**
 * Wohin nach dem Login, und was dem Nutzer gesagt werden muss.
 *
 * Dieselbe Regel wie in `requireSession`, aber als Wert: der Client würde sonst erst nach
 * /dashboard navigieren und dort vom DAL zur Passwortseite umgeleitet – diese Umleitung bleibt
 * in der Client-Cache stehen und wirft später jeden Sprung zurück auf /settings?pw=1.
 * Ohne Mitarbeiterkarte führt der Weg zu nichts als einer stillen Rückkehr auf /login, also
 * kommt der Grund mit.
 */
export async function startRouteAction(): Promise<{ route: string; notice: string | null }> {
  const state = await getLoginState(await headers());

  if (state.kind === "context") {
    return { route: startRoute(state.ctx), notice: null };
  }

  return { route: "/login", notice: loginNotice(state) };
}
